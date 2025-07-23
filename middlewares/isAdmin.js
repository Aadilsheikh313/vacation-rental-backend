import ErrorHandler from "./errorMiddleware.js";

export const isAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return next(new ErrorHandler("Access denied! Admins only.", 403));
  }
  next();
};