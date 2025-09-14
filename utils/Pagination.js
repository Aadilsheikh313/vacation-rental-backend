import { catchAsyncError } from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../middlewares/errorMiddleware.js";
import { Property } from "../models/Property.js";

export const getProperties = catchAsyncError(async (req, res, next) => {
  // Query params se page aur limit lo, default 1 rakho
  let { page = 1, limit = 10 } = req.query;
  page = Number(page);
  limit = Number(limit);

  // Total property count
  const total = await Property.countDocuments();

  // Agar properties hi nahi hain
  if (total === 0) {
    return next(new ErrorHandler("No properties found", 404));
  }

  // Pagination ke liye calculate karo
  const properties = await Property.find()
    .skip((page - 1) * limit)
    .limit(limit);

  const totalPages = Math.ceil(total / limit);

  res.json({
    success: true,
    properties,         
    total,              
    totalPages,         
    currentPage: page,  
    hasMore: page < totalPages 
  });
});
