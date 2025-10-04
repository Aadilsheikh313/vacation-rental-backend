import { resolve } from "path";
import cloudinary from "../config/cloudinary.js";
import { catchAsyncError } from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../middlewares/errorMiddleware.js";
import { User } from "../models/User.js";
import streamifier from "streamifier";


// ================= Get User Profile Controller =================
export const userProfile = catchAsyncError(async (req, res, next) => {
  const userId = req.user._id;
  const user = await User.findById(userId).select("-password");

  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  res.status(200).json({
    success: true,
    user,
  });
});


// ================= Update Profile Controller =================

export const updateUserProfile = catchAsyncError(async (req, res, next) => {
  const { name, phone, avatar, bio, dob, gender, location } = req.body;
  const user = await User.findById(req.user._id);
  if (!user) return next(new ErrorHandler("User not found", 404));

  if (name) user.name = name;
  if (phone) user.phone = phone;
  if (bio) user.bio = bio;
  if (dob) user.dob = dob;
  if (gender) user.gender = gender;
  if (location) user.location = location;

  //Avator 
  if (req.file) {
    // Purani image delte karo
    if (user.avatar?.public_id) {
      await cloudinary.uploader.destroy(user.avatar?.public_id);
    }

    //Nayi image upload

    const streamUpload = (buffer) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "avatar" },
          (error, result) => {
            if (result) resolve(result);
            else reject(error);
          }
        );
        streamifier.createReadStream(buffer).pipe(stream);
      });
    };
    const result = await streamUpload(req.file.buffer);
    user.avatar = {
      public_id: result.public_id,
      url: result.secure_url,
    };
  }
  // Save without re-running required validators on existing fields
  await user.save({ validateBeforeSave: false });

  res.status(200).json({ success: true, message: "Profile updated successfully!", user });
});
