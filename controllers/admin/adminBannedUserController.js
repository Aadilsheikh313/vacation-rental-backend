import { catchAsyncError } from "../../middlewares/catchAsyncError.js";
import {User} from "../../models/User.js";
import ErrorHandler from "../../middlewares/errorMiddleware.js";
import { Log } from "../../models/Log.js";


//Admin Banned the user
export const adminBannedUser = catchAsyncError(async (req, res, next) => {
  const { userId } = req.params;
  const { reason } = req.body; // 🆕 Take reason from body
  const adminId = req.user._id;

  const user = await User.findById(userId);
  if (!user) return next(new ErrorHandler("User not found", 404));

  if (user.role === "admin") {
    return next(new ErrorHandler("You cannot ban another admin", 403));
  }

  if (user.isBanned) return next(new ErrorHandler("User is already banned", 400));

  user.isBanned = true;
  user.bannedBy = adminId;
  user.bannedAt = new Date();
  user.banReason = reason || "Violation of rules";
  await user.save();

   await Log.create({
  action: "ban",
  performedBy: adminId,
  targetUser: userId,
  reason: user.banReason,
});

  res.status(200).json({
    success: true,
    message: `User ${user.name} has been banned.`,
  });
});


export const adminUnbanUser = catchAsyncError(async (req, res, next) => {
  const { userId } = req.params;
  const { note } = req.body; // 🆕 unban note
  const adminId = req.user._id;

  const user = await User.findById(userId);
  if (!user) return next(new ErrorHandler("User not found", 404));

  if (!user.isBanned) return next(new ErrorHandler("User is not banned", 400));

  if (!user.bannedBy || user.bannedBy.toString() !== adminId.toString()) {
    return next(new ErrorHandler("You are not authorized to unban this user", 403));
  }

  user.isBanned = false;
  user.bannedBy = null;
  user.bannedAt = null;
  user.unbannedAt = new Date(); // 🆕
  user.unbanNote = note || "Unbanned after review";
  user.banReason = null;
  await user.save();

  await Log.create({
  action: "unban",
  performedBy: adminId,
  targetUser: userId,
  note: user.unbanNote,
});


  res.status(200).json({
    success: true,
    message: `User ${user.name} has been unbanned.`,
  });
});


// ✅ Get all ban/unban logs (with complete user/admin info)
export const getBanLogs = catchAsyncError(async (req, res, next) => {
  const logs = await Log.find()
    .populate("performedBy", "name email phone createdAt") // Admin
    .populate("targetUser", "name email phone createdAt isBanned bannedAt unbannedAt bannedBy banReason unbanNote") // User
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    logs,
  });
});
