import ErrorHandler from "./errorMiddleware.js";

export const isAdmin = (req, res, next) => {
  const admin = req.admin;
  if (!admin || admin.role !== "admin") {
    return next(new ErrorHandler("Access denied! Admins only.", 403));
  }
  next();
};
