import { catchAsyncError } from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../middlewares/errorMiddleware.js";
import { User } from "../models/User.js";

// ================= Get User Profile Controller =================
export const userProfile = catchAsyncError(async (req , res , next) => {
    const userId = req.user._id;
   const user = await User.findById(userId).select("-password"); 

    if(!user){
        return next(new ErrorHandler("User not found", 404));
    }

    res.status(200).json({
        success: true,
        user,
    });
});


// ================= Update Profile Controller =================
export const updateUserProfile = catchAsyncError(async (req, res, next) => {
  const userId = req.user._id;
  const { name, phone, avatar, bio, dob, gender, location } = req.body;

  let user = await User.findById(userId);
  if (!user) return next(new ErrorHandler("User not found", 404));

  // ✅ Update allowed fields
  if (name) user.name = name;
  if (phone) user.phone = phone;
  if (bio) user.bio = bio;
  if (dob) user.dob = dob;
  if (gender) user.gender = gender;
  if (location) user.location = location;

  // ✅ Avatar update (if using cloudinary or direct URL)
  if (avatar && avatar.url) {
    user.avatar = {
      public_id: avatar.public_id || user.avatar.public_id,
      url: avatar.url,
    };
  }

  await user.save();

  res.status(200).json({
    success: true,
    message: "Profile updated successfully!",
    user,
  });
});
