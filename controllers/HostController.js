import { catchAsyncError } from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../middlewares/errorMiddleware.js";
import { Booking } from "../models/Booking.js";
import { Host } from "../models/HostSchema.js";

export const submitHostProfile = catchAsyncError(async (req, res, next) => {
  const { governmentID, governmentIDImage, payout } = req.body;
  const userId = req.user._id;

  if (req.user.role !== "host") {
    return next(new ErrorHandler("Only hosts can submit this form", 403));
  }

  if (!governmentID || !governmentIDImage) {
    return next(new ErrorHandler("Please provide government ID and its image", 400));
  }

  const host = await Host.findOneAndUpdate(
    { user: userId },
    {
      $set: {
        governmentID,
        governmentIDImage,
        payout: payout || undefined,
        verificationStatus: "pending",
        lastUpdatedAt: Date.now(),
      },
      $push: {
        audit: {
          action: "applied",
          performedBy: userId,
          performedByModel: "User",
          note: "Host submitted profile for verification",
          date: new Date(),
        },
      },
    },
    { new: true, runValidators: true }
  );

  if (!host) return next(new ErrorHandler("Host profile not found", 404));

  res.status(200).json({
    success: true,
    message: "Host profile submitted for verification",
    host,
  });
});


