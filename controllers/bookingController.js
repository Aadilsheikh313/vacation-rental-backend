import { catchAsyncError } from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../middlewares/errorMiddleware.js";
import { Booking } from "../models/Booking.js";
import { Property } from "../models/Property.js";
import { Review } from "../models/Review.js"
import mongoose from "mongoose";
import sendEmail from "../utils/emailService.js";


// Get all bookings for logged-in user
export const getBookingProperty = catchAsyncError(async (req, res, next) => {
  const bookings = await Booking.find({ user: req.user._id })

    .populate({
      path: "property",
      select: "title image city userId",
      populate: {
        path: "userId",
        select: "name email phone"
      }
    })
    .sort({ createdAt: -1 });


  res.status(200).json({
    success: true,
    bookings,
  });
});

export const postBookingProperty = catchAsyncError(async (req, res, next) => {
  const {
    checkIn,
    checkOut,
    guests,
    numberOfNights,
    serviceFee,
    taxes,
    paymentMethod
  } = req.body;
  const propertyId = req.params.propertyId;

  if (!checkIn || !checkOut || !guests || !numberOfNights || !paymentMethod) {
    return next(new ErrorHandler("All booking fields are required", 400));
  }

  const property = await Property.findById(propertyId);
  if (!property) return next(new ErrorHandler("Property not found", 404));

  //Check if the user is a guest or host
  if (req.user?.role.toLowerCase() === "host") {
    return next(new ErrorHandler("Hosts are not allowed to book properties", 403));
  }

  // ✅ Check if user has already booked this property
  const existingBooking = await Booking.findOne({
    user: req.user._id,
    property: propertyId,
    bookingStatus: { $in: ["pending", "confirmed"] },
  });

  if (existingBooking) {
    return next(new ErrorHandler("You have already booked this property", 409));
  }

  // ✅ Check if property is booked for same dates by anyone
  const conflict = await Booking.findOne({
    property: propertyId,
    $or: [
      { checkIn: { $lte: checkOut }, checkOut: { $gte: checkIn } }
    ],
    bookingStatus: { $in: ["pending", "confirmed"] }
  });

  if (conflict) {
    return next(new ErrorHandler("Property already booked for selected dates", 409));
  }

  const pricePerNight = property.price;
  const totalAmount = pricePerNight * numberOfNights + serviceFee + taxes;
  const isCash = paymentMethod === "cash";

  const booking = await Booking.create({
    user: req.user._id,
    property: property._id,
    checkIn,
    checkOut,
    guests,
    pricePerNight,
    numberOfNights,
    serviceFee,
    taxes,
    totalAmount,
    paymentMethod,
    paymentStatus: isCash ? "paid" : "pending",
    bookingStatus: isCash ? "confirmed" : "pending",
  });

  res.status(201).json({
    success: true,
    message: "Booking created successfully",
    booking,
  });
});


// Expend the booking date both 
export const editBookingPropertyDate = catchAsyncError(async (req, res, next) => {
  const bookingId = req.params.bookingId;
  const { checkIn, checkOut, guests } = req.body;

  // ✅ Get existing booking
  const booking = await Booking.findById(bookingId).populate("property");
  if (!booking) return next(new ErrorHandler("Booking not found", 404));

  // ✅ Ensure only the same user can edit
  if (booking.user.toString() !== req.user._id.toString()) {
    return next(new ErrorHandler("You are not authorized to edit this booking", 403));
  }

  // ✅ Prevent editing if booking is already completed
  if (new Date() > new Date(booking.checkOut)) {
    return next(new ErrorHandler("Cannot update a past/completed booking", 400));
  }

  // ✅ Prevent editing if no actual change in booking
  const sameCheckIn = new Date(booking.checkIn).toDateString() === new Date(checkIn).toDateString();
  const sameCheckOut = new Date(booking.checkOut).toDateString() === new Date(checkOut).toDateString();
  const sameGuests = booking.guests === guests;

  if (sameCheckIn && sameCheckOut && sameGuests) {
    return next(new ErrorHandler("No changes detected in booking details", 400));
  }

  // ✅ Conflict check: same property already booked for new dates by someone else
  const conflict = await Booking.findOne({
    _id: { $ne: bookingId },
    property: booking.property._id,
    $or: [
      { checkIn: { $lte: checkOut }, checkOut: { $gte: checkIn } }
    ],
    bookingStatus: { $in: ["pending", "confirmed"] }
  });

  if (conflict) {
    return next(new ErrorHandler("Property already booked for the selected dates", 409));
  }

  // ✅ Updated price and total
  const updatedPrice = booking.property.price;
  const numberOfNights = Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24));
  const totalNights = numberOfNights > 0 ? numberOfNights : 1;

  let newTotalAmount = updatedPrice * totalNights + booking.serviceFee + booking.taxes;

  // // 🔁 Mock penalty refund logic (if user had previously cancelled same booking — optional)
  // let penalty = 0;
  // let wasPreviouslyCancelled = false;

  // // Optionally you can check a `CancelledBookings` model or track cancel history in user model
  // if (wasPreviouslyCancelled) {
  //   penalty = Math.round(newTotalAmount * 0.3); // 30% penalty
  //   newTotalAmount -= penalty;
  // }

  // ✅ Update booking details
  booking.checkIn = checkIn;
  booking.checkOut = checkOut;
  booking.guests = guests;
  booking.pricePerNight = updatedPrice;
  booking.numberOfNights = totalNights;
  booking.totalAmount = newTotalAmount;
  booking.paymentStatus = "pending";
  booking.bookingStatus = "pending";

  await booking.save();

  res.status(200).json({
    success: true,
    message: "Booking updated successfully",
    updatedBooking: booking,
    // penaltyApplied: penalty > 0 ? `₹${penalty} deducted` : "No penalty",
  });
});

//Cancel Booking 
export const cancelBookingPropertyDate = catchAsyncError(async (req, res, next) => {
  const bookingId = req.params.bookingId;

  const booking = await Booking.findById(bookingId).populate("property");
  if (!booking) {
    return next(new ErrorHandler("Booking not found", 404));
  }

  if (booking.user.toString() !== req.user._id.toString() && req.user.role !== "host") {
    return next(new ErrorHandler("You are not authorized to cancel this booking", 403));
  }

  const today = new Date();
  const checkInDate = new Date(booking.checkIn);
  const checkOutDate = new Date(booking.checkOut);

  if (today > checkOutDate) {
    return next(new ErrorHandler("Cannot cancel a completed booking", 400));
  }

  if (booking.bookingStatus === "cancelled") {
    return next(new ErrorHandler("Booking is already cancelled", 400));
  }

  // ✅ Dummy refund logic — use this until payment system is integrated
  let refundableAmount = 0;
  let penalty = 0;

  if (today < checkInDate) {
    penalty = Math.round(booking.totalAmount * 0.3);
    refundableAmount = booking.totalAmount - penalty;
  } else if (today >= checkInDate && today < checkOutDate) {
    const remainingNights = Math.ceil((checkOutDate - today) / (1000 * 60 * 60 * 24));
    const refundBase = booking.pricePerNight * remainingNights;
    penalty = Math.round(refundBase * 0.3);
    refundableAmount = refundBase - penalty;
  } else {
    refundableAmount = 0;
  }


  // 🔁 When integrating real Paytm/Stripe, replace this with actual refund API call
  console.log("💰 DUMMY REFUND initiated:", refundableAmount, "Penalty:", penalty);

  booking.bookingStatus = "cancelled";
  booking.paymentStatus = "refunded";
  booking.isRefunded = true;
  booking.cancelledAt = new Date();

  await booking.save();

  res.status(200).json({
    success: true,
    message: "Booking cancelled and refund processed (mock)",
    bookingId: booking._id,
    refundAmount: refundableAmount,
    penaltyAmount: penalty,
  });
});

// Check already booking date alvible  yah not avale 

export const checkBookingConflict = catchAsyncError(async (req, res, next) => {
  const { propertyId } = req.params;
  const { userId } = req.query;

  // ✅ Validate property ID
  if (!mongoose.Types.ObjectId.isValid(propertyId)) {
    return next(new ErrorHandler("Invalid Property ID", 400));
  }

  // ✅ Check if the user already booked it (optional check)
  const existingBooking = userId
    ? await Booking.findOne({
      user: userId,
      property: propertyId,
      bookingStatus: { $in: ["pending", "confirmed"] },
    })
    : null;

  // ✅ Get booked dates (only future/ongoing bookings)
  const conflictBookings = await Booking.find({
    property: propertyId,
    bookingStatus: { $in: ["pending", "confirmed"] },
    checkOut: { $gte: new Date() },  // ignore past bookings
  }).select("checkIn checkOut");

  res.status(200).json({
    success: true,
    alreadyBooked: !!existingBooking,
    bookedDates: conflictBookings,
  });
});

//Guest past Booking and canceled booking
export const getPastandCancelledBooking = catchAsyncError(async (req, res, next) => {
  const today = new Date();

  const bookings = await Booking.find({
    user: req.user._id,
    $or: [
      { bookingStatus: "cancelled" },
      { checkOut: { $lt: today } }
    ]
  })
    .populate({
      path: "property",
      select: "title image city userId",
      populate: {
        path: "userId",
        select: "name email phone"
      }
    })
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    bookings,
  });
})

// Delete the Guest's past and cancelled booking history
export const deleteGuestHistroyBooking = catchAsyncError(async (req, res, next) => {
  const bookingId = req.params.bookingId;

  const booking = await Booking.findById(bookingId);

  if (!booking) {
    return next(new ErrorHandler("Booking not found", 404));
  }

  // Ensure only the owner (guest) can delete
  if (booking.user.toString() !== req.user._id.toString()) {
    return next(new ErrorHandler("You are not authorized to delete this booking", 403));
  }

  const today = new Date();
  const isCancelled = booking.bookingStatus === "cancelled";
  const isPast = new Date(booking.checkOut) < today;

  // Allow deletion only if booking is cancelled or past
  if (!isCancelled && !isPast) {
    return next(new ErrorHandler("Only cancelled or past bookings can be deleted", 400));
  }

  await Booking.findByIdAndDelete(bookingId);

  res.status(200).json({
    success: true,
    message: "Booking history deleted successfully",
    deletedBookingId: bookingId,
  });
});


// Get a Host Active booked Property
export const getActiveBooking = catchAsyncError(async (req, res, next) => {
  const hostId = req.user._id;
  const today = new Date();

  const limit = parseInt(req.query.limit) || 10;
  const page = parseInt(req.query.page) || 1;
  const skip = (page - 1) * limit;

  // ✅ Fix: Use correct variable name
  const hostProperty = await Property.find({ userId: hostId }).select("_id");
  const propertyIds = hostProperty.map((p) => p._id);

  if (!propertyIds.length) {
    return res.status(200).json({
      success: true,
      message: "No properties found for this host.",
      bookings: [],
      totalRevenue: 0,
      totalNights: 0,
      totalBookings: 0,
    });
  }

  const bookings = await Booking.find({
    property: { $in: propertyIds }, // ✅ this works now
    bookingStatus: { $in: ["pending", "confirmed"] },
    checkOut: { $gte: today },
  })
    .populate("property", "title image city")
    .populate("user", "name email phone")
    .sort({ checkIn: 1 })
    .skip(skip)
    .limit(limit);

  let totalRevenue = 0;
  let totalNights = 0;

  bookings.forEach((booking) => {
    totalRevenue += booking.totalAmount;
    totalNights += booking.numberOfNights;
  });

  const totalBookings = await Booking.countDocuments({
    property: { $in: propertyIds },
    bookingStatus: { $in: ["pending", "confirmed"] },
    checkOut: { $gte: today },
  });

  res.status(200).json({
    success: true,
    totalActiveBookings: bookings.length,
    page,
    limit,
    totalPages: Math.ceil(totalBookings / limit),
    totalBookings,
    totalRevenue,
    totalNights,
    bookings,
  });
});

// Get all host histroy booking property only
export const getHostBookingHistory = catchAsyncError(async (req, res, next) => {
  const hostId = req.user._id;

  const hostProperties = await Property.find({ userId: hostId }).lean();

  const result = [];
  let totalRevenue = 0;
  let totalNights = 0;
  let totalBookings = 0;

  for (const property of hostProperties) {
    const bookings = await Booking.find({
      property: property._id,
    })
      .populate({ path: "user", select: "name email phone" })
      .sort({ createdAt: -1 })
      .lean();

    totalBookings += bookings.length;
    bookings.forEach((booking) => {
      totalRevenue += booking.totalAmount;
      totalNights += booking.numberOfNights;
    });

    // For each booking, attach review
    for (let booking of bookings) {
      const review = await Review.findOne({
        property: booking.property,
        user: booking.user._id,
      }).select("rating comment");

      booking.review = review || null;
    }

    result.push({
      propertyId: property._id,
      title: property.title,
      image: property.image,
      city: property.city,
      bookings, // ✅ can be empty if no bookings
    });
  }

  res.status(200).json({
    success: true,
    properties: result,
    totalBookings,
    totalRevenue,
    totalNights,
  });
});

