import { catchAsyncError } from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../middlewares/errorMiddleware.js";
import { Booking } from "../models/Booking.js";

export const GuestPastBooking = catchAsyncError(async (req, res, next) => {
  const today = new Date();

  // Yesterday’s date (end of yesterday 23:59:59)
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(23, 59, 59, 999);

  // GuestId from logged in user or params
  const guestId = req.user?._id || req.params.guestId;
  if (!guestId) {
    return next(new ErrorHandler("Guest ID is required", 400));
  }

  // ✅ Correct field names as per schema
  const bookings = await Booking.find({
    user: guestId,                 // 👈 guest = user
    checkOut: { $lte: yesterday }, // 👈 checkOut (not checkOutDate)
    bookingStatus: { $ne: "cancelled" }
  }).sort({ checkOut: -1 });

  if (!bookings || bookings.length === 0) {
    return res.status(200).json({
      success: true,
      message: "No past bookings found",
      totalPastBookings: 0,
      bookings: [],
    });
  }

  // Total count
  const totalPastBookings = bookings.length;

  res.status(200).json({
    success: true,
    totalPastBookings,
    bookings,
  });
});
