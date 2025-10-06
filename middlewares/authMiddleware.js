
import { catchAsyncError } from "./catchAsyncError.js";
import ErrorHandler from "./errorMiddleware.js";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import { Admin } from "../models/admin.js";

export const isAuthorized = catchAsyncError(async (req, res, next) => {
  let token = req.cookies.token;

  if (!token && req.headers.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next(new ErrorHandler("No token provided", 401));
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
  } catch (err) {
    return next(new ErrorHandler("Invalid or expired token", 403));
  }

  let user = await User.findById(decoded.id);
  if (user) {
    if (user.isBanned) {
      return next(new ErrorHandler("Your account has been banned.", 403));
    }
    req.user = user;
    req.user.role = decoded.role || "user";
    return next();
  }

  let admin = await Admin.findById(decoded.id);
  if (admin) {
    req.admin = admin;
    req.admin.role = decoded.role || "admin";
    return next();
  }

  return next(new ErrorHandler("User not found", 404));
});
