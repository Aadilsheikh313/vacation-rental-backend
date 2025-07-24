
import { catchAsyncError } from "./catchAsyncError.js";
import ErrorHandler from "./errorMiddleware.js";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import { Admin } from "../models/admin.js";

export const isAuthorized = catchAsyncError(async (req, res, next) => {
  let token = req.cookies.token;

  // fallback: Authorization header
  if (!token && req.headers.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next(new ErrorHandler("User not authorized", 400));
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

  let user = await User.findById(decoded.id || decoded._id); // ✅ Safe
  
   // ❌ If not found in User, try Admin model
  if (!user) {
    user = await Admin.findById(decoded.id || decoded._id);
    if (!user) {
      return next(new ErrorHandler("User not found", 404));
    }
  }

  req.user = user;
  req.user.role = decoded.role;
  next();
});
