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

  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  // If user is HOST → Fetch host details
  const role = user.role;

  if (role === "host") {
    const host = await Host.findOne({ user: user._id });

    if (!host) {
      return next(new ErrorHandler("Host details not found for this user.", 404));
    }
    const token = user.getJWTToken();
    return res.status(200).json({
      success: true,
      message: "Host Profile Featch Successfully!",
      token,
      user,
      host,
    });
  }
  res.status(200).json({
    success: true,
    message: "User Profile fetched successfully!",
    user,
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
    qrCodeUrl,
    bankDetails,
  } = req.body;

  const user = await User.findById(req.user._id);
  if (!user) return next(new ErrorHandler("User not found", 404));

  // ✅ Update basic info
  if (name) user.name = name;
  if (phone) user.phone = phone;
  if (bio) user.bio = bio;
  if (dob) user.dob = dob;
  if (gender) user.gender = gender;
  if (location) user.location = location;

  // ✅ Helper: Upload buffer to Cloudinary
  const streamUpload = (buffer, folder) => {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder },
        (error, result) => {
          if (result) resolve(result);
          else reject(error);
        }
      );
      streamifier.createReadStream(buffer).pipe(stream);
    });
  };

  // ✅ Handle Avatar upload (if provided)
  if (req.files && req.files.avatar && req.files.avatar[0]) {
    const avatarBuffer = req.files.avatar[0].buffer;

    // Delete old avatar from Cloudinary
    if (user.avatar?.public_id) {
      await cloudinary.uploader.destroy(user.avatar.public_id);
    }

    const result = await streamUpload(avatarBuffer, "avatar");
    user.avatar = { public_id: result.public_id, url: result.secure_url };
  }

  // ✅ Save user info
  await user.save({ validateBeforeSave: false });

  // ✅ If user is HOST → update host-specific data
  if (user.role === "host") {
    let host = await Host.findOne({ user: user._id });
    if (!host) return next(new ErrorHandler("Host profile not found", 404));

    if (governmentID) host.governmentID = governmentID;
    if (governmentIDNumber) host.governmentIDNumber = governmentIDNumber;


    // Handle Government ID Image upload (if provided)
    if (req.files && req.files.governmentIDImage && req.files.governmentIDImage[0]) {
      const govBuffer = req.files.governmentIDImage[0].buffer;

      // Delete old ID image if exists
      if (host.governmentIDImage?.public_id) {
        await cloudinary.uploader.destroy(host.governmentIDImage.public_id);
      }

      const govResult = await streamUpload(govBuffer, "Verification");
      host.governmentIDImage = {
        public_id: govResult.public_id,
        url: govResult.secure_url,
      };
    }

    // ✅ Update Cancelled Cheque Image
    if (req.files?.cancelledChequeImage?.[0]) {
      const chequeBuffer = req.files.cancelledChequeImage[0].buffer;
      if (host.cancelledChequeImage?.public_id) await cloudinary.uploader.destroy(host.cancelledChequeImage.public_id);
      const chequeResult = await streamUpload(chequeBuffer, "cheque");
      host.cancelledChequeImage = { public_id: chequeResult.public_id, url: chequeResult.secure_url };
    }

    if(req.files?.qrCodeUrl?.[0]){
      const qrCodeBuffer = req.files.qrCodeUrl[0].buffer;
      if(host.qrCodeUrl) await cloudinary.uploader.destroy(host.qrCodeUrl);
      const qrCodeResult = await streamUpload(qrCodeBuffer, "upi_qr");
      host.qrCodeUrl = {public_id: qrCodeResult.public_id, url: qrCodeResult.secure_url};
    }
    
    if(bankDetails)host.bankDetails = bankDetails;
    if(upiId)host.upiId = upiId;
    
    await host.save({ validateBeforeSave: false });
  }

  res.status(200).json({
    success: true,
    message: "Profile updated successfully!",
    user,
  });
});
