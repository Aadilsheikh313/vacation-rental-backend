
import { catchAsyncError } from "../../middlewares/catchAsyncError.js";
import ErrorHandler from "../../middlewares/errorMiddleware.js";
import { Admin } from "../../models/admin.js";
import jwt from "jsonwebtoken";
import { adminSchemaValidator } from "../../validators/adminValidator.js";

// Send Token Function
const sendToken = (admin, statusCode, res, message) => {
  const token = jwt.sign({ id: admin._id, role: "admin" }, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.JWT_EXPIRE,
  });

  const options = {
    expires: new Date(Date.now() + process.env.COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
    httpOnly: true,
    sameSite: "Lax",
    secure: process.env.NODE_ENV === "production",
  };
  const { password, ...adminData } = admin._doc;
  res.status(statusCode).cookie("token", token, options).json({
    success: true,
    message,
    admin: adminData,
    token,
  });
};

export const adminRegister = catchAsyncError(async (req, res, next) => {
  const { error } = adminSchemaValidator.validate(req.body);
  if (error) return next(new ErrorHandler(error.details[0].message, 400));
  const { name, email, password, phone, secretCode } = req.body;

  // Check secret code
  if (secretCode !== process.env.ADMIN_SECRET_CODE) {
    return next(new ErrorHandler("Invalid admin secret code", 403));
  }

  const existingAdmin = await Admin.findOne({ email });
  if (existingAdmin) {
    return next(new ErrorHandler("Admin already exists with this email", 400));
  }
  try {
    const newAdmin = await Admin.create({ name, email, password, phone });
    sendToken(newAdmin, 201, res, "Admin registered successfully");
  } catch (err) {
    if (err.code === 11000) {
      return next(new ErrorHandler("Email already in use", 400));
    }
    next(err);
  }

});

export const adminLogin = catchAsyncError(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new ErrorHandler("Please provide email and password", 400));
  }

  const admin = await Admin.findOne({ email }).select("+password");

  if (!admin) {
    return next(new ErrorHandler("Invalid email or password", 401));
  }

  const isMatch = await admin.comparePassword(password);

  if (!isMatch) {
    return next(new ErrorHandler("Invalid email or password", 401));
  }

  sendToken(admin, 200, res, "Admin logged in successfully");
});

export const adminLogout = catchAsyncError(async (req, res, next) => {
  res.cookie("token", "", {
    expires: new Date(Date.now()),
    httpOnly: true,
    sameSite: "Lax",
  });

  res.status(200).json({
    success: true,
    message: "Admin logged out successfully",
  });
});
