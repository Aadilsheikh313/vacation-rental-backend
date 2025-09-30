import { catchAsyncError } from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../middlewares/errorMiddleware.js";
import { Booking } from "../models/Booking.js";
import { Property } from "../models/Property.js";
import { Review } from "../models/Review.js"
import mongoose from "mongoose";
import sendEmail from "../utils/emailService.js";


// Get all bookings for logged-in user
export const getBookingProperty = catchAsyncError(async (req, res, next) => {
  const bookings = await Booking.find({ guest: req.user._id })

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
    serviceFee: clientServiceFee = 0,
    paymentMethod,
    discountAmount = 0,
    couponCode = null,
  } = req.body;

  const propertyId = req.params.propertyId;

  // ✅ Basic validation
  if (!checkIn || !checkOut || !guests || !paymentMethod) {
    return next(new ErrorHandler("All booking fields are required", 400));
  }
  if (!Number.isInteger(guests.adults) || guests.adults < 1) {
    return next(new ErrorHandler("At least one adult is required", 400));
  }

  // ✅ Parse dates
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  checkOutDate.setHours(0, 0, 0, 0);
  if (isNaN(checkInDate) || isNaN(checkOutDate)) {
    return next(new ErrorHandler("Invalid check-in or check-out date", 400));
  }
  // Normalize both dates (set time to midnight)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  checkInDate.setHours(0, 0, 0, 0);

  if (checkInDate < today) {
    return next(new ErrorHandler("Check-in date cannot be in the past.", 400));
  }


  const property = await Property.findById(propertyId);
  if (!property) return next(new ErrorHandler("Property not found", 404));

  // ❌ Hosts cannot book
  if (req.user?.role?.toLowerCase() === "host") {
    return next(new ErrorHandler("Hosts are not allowed to book properties", 403));
  }

  // ✅ Calculate number of nights
  const msInDay = 1000 * 60 * 60 * 24;
  const numberOfNights = Math.ceil((checkOutDate - checkInDate) / msInDay);

  // ✅ Check overlapping bookings
  const conflict = await Booking.findOne({
    property: propertyId,
    bookingStatus: { $in: ["pending", "confirmed"] },
    checkIn: { $lte: checkOutDate },
    checkOut: { $gte: checkInDate },
  });

  if (conflict) {
    return next(new ErrorHandler("Property already booked for selected dates", 409));
  }

  // ✅ Price, tax, and total calculation
  const pricePerNight = Number(property.price);
  const subtotalAmount = pricePerNight * numberOfNights;
  const serviceFee = Number(clientServiceFee) || 0;

  // Example GST calculation
  let gstRate = 0;
  if (pricePerNight >= 1001 && pricePerNight <= 7499) gstRate = 12;
  else if (pricePerNight >= 7500) gstRate = 18;

  const taxAmount = Number(((subtotalAmount - discountAmount) * (gstRate / 100)).toFixed(2));
  const totalAmount = Number((subtotalAmount - discountAmount + serviceFee + taxAmount).toFixed(2));

  const isCash = paymentMethod === "cash";

  // ✅ Transaction to avoid race condition
  const session = await mongoose.startSession();
  let createdBooking;

  try {
    await session.withTransaction(async () => {
      // Re-check conflict inside transaction
      const conflict2 = await Booking.findOne({
        property: propertyId,
        bookingStatus: { $in: ["pending", "confirmed"] },
        checkIn: { $lte: checkOutDate },
        checkOut: { $gte: checkInDate },
      }).session(session);

      if (conflict2) throw new Error("Property already booked for selected dates");

      const docs = await Booking.create(
        [
          {
            guest: req.user._id,
            property: property._id,
            guests,
            checkIn: checkInDate,
            checkOut: checkOutDate,
            subtotalAmount,
            discountAmount,
            couponCode,
            taxAmount,
            totalAmount,
            paymentMethod,
            paymentStatus: isCash ? "paid" : "pending",
            bookingStatus: isCash ? "confirmed" : "pending",
            createdBy: req.user._id,
            updatedBy: req.user._id,
            statusHistory: [
              {
                status: isCash ? "confirmed" : "pending",
                changedBy: req.user._id,
                note: "Initial booking",
              },
            ],
          },
        ],
        { session }
      );

      createdBooking = docs[0];
    });
  } catch (err) {
    if (err.message && err.message.includes("Property already booked")) {
      return next(new ErrorHandler("Property already booked for selected dates", 409));
    }
    return next(err);
  } finally {
    session.endSession();
  }

  res.status(201).json({
    success: true,
    message: "Booking created successfully",
    booking: createdBooking,
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
  const { userId, checkIn, checkOut } = req.query;

  // ---------------------------
  // 1️⃣ Validate Inputs
  // ---------------------------
  if (!mongoose.Types.ObjectId.isValid(propertyId)) {
    return next(new ErrorHandler("Invalid Property ID", 400));
  }
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return next(new ErrorHandler("Invalid User ID", 400));
  }
  if (!checkIn || !checkOut) {
    return next(new ErrorHandler("Check-in and Check-out dates are required", 400));
  }

  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  checkInDate.setHours(0, 0, 0, 0);
  checkOutDate.setHours(0, 0, 0, 0);


  // ---------------------------
  // 2️⃣ SAME USER overlapping bookings
  // ---------------------------
  const existingBooking = await Booking.findOne({
    user: userId,
    property: propertyId,
    bookingStatus: { $in: ["pending", "confirmed"] },
    checkOut: { $gte: today }, // future/active bookings
    $or: [
      {
        checkIn: { $lt: checkOutDate },
        checkOut: { $gt: checkInDate }
      }
    ]
  }).select("checkIn checkOut bookingStatus");

  if (existingBooking) {
    return res.status(200).json({
      success: true,
      alreadyBookedByUser: true,
      existingBooking: {
        checkIn: existingBooking.checkIn,
        checkOut: existingBooking.checkOut,
        status: existingBooking.bookingStatus,
      },
      message: "You have already booked this property. To edit your booking, visit Guest Dashboard.",
    });
  }

  // ---------------------------
  // 3️⃣ OTHER USERS overlapping bookings
  // ---------------------------
  const conflictBookings = await Booking.find({
    property: propertyId,
    user: { $ne: userId },
    bookingStatus: { $in: ["pending", "confirmed"] },
    checkOut: { $gte: today },
    $and: [
      { checkIn: { $lt: checkOutDate } },
      { checkOut: { $gt: checkInDate } }
    ]
}).select("checkIn checkOut user");


  // ---------------------------
  // 4️⃣ Return Response
  // ---------------------------
  res.status(200).json({
    success: true,
    alreadyBookedByUser: false,
    alreadyBooked: conflictBookings.length > 0,
    bookedDates: conflictBookings,
  });
});


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

