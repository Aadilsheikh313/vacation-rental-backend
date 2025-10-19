import cloudinary from "../config/cloudinary.js";
import { catchAsyncError } from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../middlewares/errorMiddleware.js";
import { Host } from "../models/HostSchema.js";
import { User } from "../models/User.js";
import streamifier from "streamifier";

// ================= Get User Profile Controller =================
export const userProfile = catchAsyncError(async (req, res, next) => {
  const userId = req.user._id;
  const user = await User.findById(userId).select("-password");

  if (!user) return next(new ErrorHandler("User not found", 404));

  let host = null;
  if (user.role === "host") {
    host = await Host.findOne({ user: user._id });
    if (!host) return next(new ErrorHandler("Host details not found for this user.", 404));
  }

  const token = user.getJWTToken();
  return res.status(200).json({
    success: true,
    message: user.role === "host" ? "Host Profile Fetched Successfully!" : "User Profile Fetched Successfully!",
    token,
    user,
    host, // safe: will be null if user is not host
  });
});

// ================= Update Profile Controller =================
export const updateUserProfile = catchAsyncError(async (req, res, next) => {
  const {
    name,
    phone,
    bio,
    dob,
    gender,
    location,
    governmentID,
    governmentIDNumber,
    upiId,
    bankDetails,
  } = req.body;

  const user = await User.findById(req.user._id);
  if (!user) return next(new ErrorHandler("User not found", 404));

  // ✅ Update basic user info
  if (name) user.name = name;
  if (phone) user.phone = phone;
  if (bio) user.bio = bio;
  if (dob) user.dob = dob;
  if (gender) user.gender = gender;
  if (location) user.location = location;

  // ✅ Helper: Upload buffer to Cloudinary
  const streamUpload = (buffer, folder) => {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream({ folder }, (error, result) => {
        if (result) resolve(result);
        else reject(error);
      });
      streamifier.createReadStream(buffer).pipe(stream);
    });
  };

  // ✅ Avatar upload
  if (req.files?.avatar?.[0]) {
    const avatarBuffer = req.files.avatar[0].buffer;

    if (user.avatar?.public_id) await cloudinary.uploader.destroy(user.avatar.public_id);

    const result = await streamUpload(avatarBuffer, "avatar");
    user.avatar = { public_id: result.public_id, url: result.secure_url };
  }

  await user.save({ validateBeforeSave: false });

  // ✅ Initialize host as null
  let host = null;

  // ✅ Update host-specific data if user is host
  if (user.role === "host") {
    host = await Host.findOne({ user: user._id });
    if (!host) return next(new ErrorHandler("Host profile not found", 404));

    // Government ID & Number
    if (governmentID) host.governmentID = governmentID;
    if (governmentIDNumber) host.governmentIDNumber = governmentIDNumber;

    // Government ID image
    if (req.files?.governmentIDImage?.[0]) {
      const govBuffer = req.files.governmentIDImage[0].buffer;
      if (host.governmentIDImage?.public_id)
        await cloudinary.uploader.destroy(host.governmentIDImage.public_id);
      const govResult = await streamUpload(govBuffer, "Verification");
      host.governmentIDImage = { public_id: govResult.public_id, url: govResult.secure_url };
    }

    // Cheque image
    if (req.files?.cancelledChequeImage?.[0]) {
      const chequeBuffer = req.files.cancelledChequeImage[0].buffer;
      if (host.cancelledChequeImage?.public_id)
        await cloudinary.uploader.destroy(host.cancelledChequeImage.public_id);
      const chequeResult = await streamUpload(chequeBuffer, "cheque");
      host.cancelledChequeImage = { public_id: chequeResult.public_id, url: chequeResult.secure_url };
    }

    // QR code
    if (req.files?.qrCode?.[0]) {
      const qrCodeBuffer = req.files.qrCode[0].buffer;
      if (host.qrCode?.public_id) await cloudinary.uploader.destroy(host.qrCode.public_id);
      const qrCodeResult = await streamUpload(qrCodeBuffer, "upi_qr");
      host.qrCode = { public_id: qrCodeResult.public_id, url: qrCodeResult.secure_url };
    }

    // Bank details & payout
    host.bankDetails = host.bankDetails || {};
    host.payout = host.payout || {};

    if (bankDetails) {
      host.bankDetails.accountHolderName = bankDetails.accountHolderName || host.bankDetails.accountHolderName;
      host.bankDetails.accountNumber = bankDetails.accountNumber || host.bankDetails.accountNumber;
      host.bankDetails.bankName = bankDetails.bankName || host.bankDetails.bankName;
      host.bankDetails.ifscCode = bankDetails.ifscCode || host.bankDetails.ifscCode;
      host.bankDetails.branchName = bankDetails.branchName || host.bankDetails.branchName;

      host.payout.bankDetails = { ...host.bankDetails };
    }

    if (upiId) {
      host.upiId = upiId;
      host.payout.upiId = upiId;
    }

    await host.save({ validateBeforeSave: false });
  }

  // ✅ Response
  res.status(200).json({
    success: true,
    message: "Profile updated successfully!",
    user,
    host, // safe: null for non-host users
  });
});
