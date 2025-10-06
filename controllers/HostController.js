import { catchAsyncError } from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../middlewares/errorMiddleware.js";
import { Host } from "../models/HostSchema.js";


export const submitHostProfile = catchAsyncError(async (req, res, next) => {
  const { governmentID, governmentIDImage, payout } = req.body;
  const userId = req.user._id;

  if (!governmentID || !governmentIDImage) {
    return next(new ErrorHandler("Please provide government ID and its image", 400));
  }

  const host = await Host.findOneAndUpdate(
    { user: userId },
    { $set: { governmentID, governmentIDImage, payout, verificationStatus: "pending", lastUpdatedAt: Date.now() } },
    { new: true, runValidators: true }
);

  if (!host) return next(new ErrorHandler("Host profile not found", 404));

  if (req.user.role !== "host") {
    return next(new ErrorHandler("Only hosts can submit this form", 403));
}


  host.governmentID = governmentID;
  host.governmentIDImage = governmentIDImage;
  if (payout) host.payout = payout; // optional
  host.verificationStatus = "pending";
  host.lastUpdatedAt = Date.now();

  host.audit.push({
    action: "applied",
    performedBy: req.user._id,
    performedByModel: "User",
    note: "Host submitted profile for verification",
});


  await host.save();

  res.status(200).json({ success: true, message: "Host profile submitted for verification", host });
});
