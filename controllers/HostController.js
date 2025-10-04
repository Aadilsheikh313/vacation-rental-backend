import { catchAsyncError } from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../middlewares/errorMiddleware.js";
import { Host } from "../models/HostSchema.js";


export const submitHostProfile = catchAsyncError(async (req, res, next) => {
  const { governmentID, governmentIDImage, payout } = req.body;
  const userId = req.user._id;

  if (!governmentID || !governmentIDImage) {
    return next(new ErrorHandler("Please provide government ID and its image", 400));
  }

  const host = await Host.findOne({ user: userId });
  if (!host) return next(new ErrorHandler("Host profile not found", 404));

  host.governmentID = governmentID;
  host.governmentIDImage = governmentIDImage;
  if (payout) host.payout = payout; // optional
  host.verificationStatus = "pending";
  host.lastUpdatedAt = Date.now();

  await host.save();

  res.status(200).json({ success: true, message: "Host profile submitted for verification", host });
});
