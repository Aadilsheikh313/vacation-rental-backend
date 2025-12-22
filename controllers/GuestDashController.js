import { catchAsyncError } from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../middlewares/errorMiddleware.js";
import { Booking } from "../models/Booking.js";
import { autoCompleteIfExpired } from "../utils/autoCompleteBooking.js";


export const GuestPastBooking = catchAsyncError(async (req, res, next) => {
  const guestId = req.user?._id || req.params.guestId;
  if (!guestId) {
    return next(new ErrorHandler("Guest ID is required", 400));
  }

  // 1️⃣ Sirf date pe filter
  const rawBookings = await Booking.find({
    user: guestId,
    checkOut: { $lt: new Date() },
    bookingStatus: { $ne: "cancelled" },
  })
    .populate({
      path: "property",
      select: "title image city userId",
      populate: {
        path: "userId",
        select: "name email phone",
      },
    })
    .sort({ checkOut: -1 });

  // 2️⃣ Runtime auto-complete
  const bookings = [];
  for (let booking of rawBookings) {
    bookings.push(await autoCompleteIfExpired(booking));
  }

  res.status(200).json({
    success: true,
    totalPastBookings: bookings.length,
    bookings,
  });
});



export const GuestCurrentBookings = catchAsyncError(async (req, res, next) => {
  const today = new Date();

  // GuestId from logged in user or params
  const guestId = req.user?._id || req.params.guestId;
  if (!guestId) {
    return next(new ErrorHandler("Guest ID is required", 400));
  }

  // Current Bookings:
  // checkIn <= today  (matlab aaj ya usse pehle check-in ho chuka hai)
  // checkOut >= today (abhi checkout nahi hua hai)
  const bookings = await Booking.find({
    user: guestId,
    checkIn: { $lte: today },
    checkOut: { $gte: today },
    bookingStatus: { $ne: "cancelled" }
  })
    .populate({
      path: "property",
      select: "title image city userId",
      populate: {
        path: "userId",
        select: "name email phone",
      },
    })
    .sort({ checkIn: 1 });

  if (!bookings || bookings.length === 0) {
    return res.status(200).json({
      success: true,
      message: "No current bookings found",
      totalCurrentBookings: 0,
      bookings: [],
    });
  }

  // Total count
  const totalCurrentBookings = bookings.length;

  res.status(200).json({
    success: true,
    totalCurrentBookings,
    bookings,
  });
});

export const GuestUpcommingBookings = catchAsyncError(async (req, res, next) => {

  const today = new Date();

  // GuestId from logged in user or params
  const guestId = req.user?._id || req.params.guestId;
  if (!guestId) {
    return next(new ErrorHandler("Guest ID is required", 400));
  }

  //Upcomming Bopking 
  //Checkin >= today
  const bookings = await Booking.find({
    user: guestId,
    checkIn: { $gte: today },
    bookingStatus: { $ne: "cancelled" }

  }).populate({
    path: "property",
    select: "title image city userId",
    populate: {
      path: "userId",
      select: "name email phone",
    },
  })
    .sort({ checkIn: 1 });

  if (!bookings || bookings.length === 0) {
    return res.status(200).json({
      success: true,
      message: "No upcomming bookings found",
      totalCurrentBookings: 0,
      bookings: [],
    });
  }

  const totalUpcommingBookings = bookings.length;

  res.status(200).json({
    success: true,
    totalUpcommingBookings,
    bookings,
  });

})

export const GuestConcelBooking = catchAsyncError(async(req, res, next) =>{

  const guestId = req.user?._id || req.params.guestId;
  if(!guestId){
    return next (new ErrorHandler("Guest ID is required", 400));
  }

  const bookings = await Booking.find({
    user: guestId,
    bookingStatus: { $eq: "cancelled" },
  }).populate({
    path: "property",
    select: "title image city userId",
    populate: {
      path: "userId",
      select: "name email phone",
    },
  })
    .sort({ checkIn: 1 });

  if (!bookings || bookings.length === 0) {
    return res.status(200).json({
      success: true,
      message: "No cancel bookings found",
      totalCancelBookings: 0,
      bookings: [],
    });
  }

  const totalCancelBookings = bookings.length;

  res.status(200).json({
    success: true,
    totalCancelBookings,
    bookings,
  });
  
})