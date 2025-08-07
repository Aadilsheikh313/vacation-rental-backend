import ErrorHandler from "./errorMiddleware.js";

export const isAdmin = (req, res, next) => {
  const role = req.user?.role || req.admin?.role;

  if (role !== "admin") {
    return next(new ErrorHandler("Access denied! Admins only.", 403));
  }
  next();
};
