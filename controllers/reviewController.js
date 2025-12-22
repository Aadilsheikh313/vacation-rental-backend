import { catchAsyncError } from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../middlewares/errorMiddleware.js";
import { Review } from "../models/Review.js";
import { Property } from "../models/Property.js";
import { Booking } from "../models/Booking.js";
import { autoCompleteIfExpired } from "../utils/autoCompleteBooking.js";

/* ======================================================
   🔧 Utility: Update Property Average Rating (DB)
====================================================== */
const updatePropertyRating = async (propertyId) => {
  const reviews = await Review.find({
    property: propertyId,
    isHidden: false,
    isVerifiedStay: true,
  });

  if (reviews.length === 0) {
    await Property.findByIdAndUpdate(propertyId, {
      avgRating: 0,
      totalReviews: 0,
    });
    return;
  }

  const avgRating =
    reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

  await Property.findByIdAndUpdate(propertyId, {
    avgRating: Number(avgRating.toFixed(1)), // ✅ HERE
    totalReviews: reviews.length,
  });
};

/* ======================================================
   1️⃣ Get All Reviews for a Property
====================================================== */
export const getAllReviewsForProperty = catchAsyncError(async (req, res) => {
  const reviews = await Review.find({
    property: req.params.propertyId,
    isHidden: false,
    isVerifiedStay: true,
  })
    .sort({ createdAt: -1 })
    .populate("user", "name avatar");

  res.status(200).json({
    success: true,
    reviews,
  });
});

/* ======================================================
   2️⃣ Post Review (Verified Stay Only)
====================================================== */
export const postReview = catchAsyncError(async (req, res, next) => {
  const userId = req.user._id;
  const propertyId = req.params.propertyId;
  const { rating, comment, cleanliness, comfort, service, location } = req.body;

  // 1️⃣ Booking lao (NO completed filter)
  let booking = await Booking.findOne({
    user: userId,
    property: propertyId,
    paymentStatus: "paid",
    checkOut: { $lt: new Date() },
  }).sort({ checkOut: -1 });

  if (!booking) {
    return next(
      new ErrorHandler("You can review only after completing your stay", 403)
    );
  }

  // 2️⃣ 🔥 AUTO-COMPLETE HERE (CORRECT PLACE)
  booking = await autoCompleteIfExpired(booking);

  // 3️⃣ Final status validation
  if (booking.bookingStatus !== "completed") {
    return next(
      new ErrorHandler("You can review only after completing your stay", 403)
    );
  }

  // 4️⃣ Prevent duplicate review (extra safety)
  const alreadyReviewed = await Review.findOne({
    user: userId,
    property: propertyId,
  });

  if (alreadyReviewed) {
    return next(
      new ErrorHandler("You have already reviewed this property", 400)
    );
  }

  // 5️⃣ Create review
  const review = await Review.create({
    user: userId,
    property: propertyId,
    rating,
    comment,
    cleanliness,
    comfort,
    service,
    location,
    isVerifiedStay: true,
  });

  // 6️⃣ Update property rating
  await updatePropertyRating(propertyId);

  res.status(201).json({
    success: true,
    message: "Review submitted successfully",
    review,
  });
});


/* ======================================================
   3️⃣ Edit Review (48 Hours Window)
====================================================== */
export const editReview = catchAsyncError(async (req, res, next) => {
  const review = await Review.findById(req.params.reviewId);

  if (!review) return next(new ErrorHandler("Review not found", 404));

  if (review.user.toString() !== req.user._id.toString()) {
    return next(new ErrorHandler("Unauthorized", 403));
  }

  const hoursPassed =
    (Date.now() - review.createdAt.getTime()) / (1000 * 60 * 60);

  if (hoursPassed > 48) {
    return next(
      new ErrorHandler("Review edit window expired (48 hours)", 400)
    );
  }

  const allowedFields = [
    "rating",
    "comment",
    "cleanliness",
    "comfort",
    "service",
    "location",
  ];

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      review[field] = req.body[field];
    }
  });

  await review.save();
  await updatePropertyRating(review.property); // ✅ RE-CALCULATE

  res.status(200).json({
    success: true,
    message: "Review updated successfully",
    review,
  });
});

/* ======================================================
   4️⃣ Host Reply
====================================================== */
export const hostReplyToReview = catchAsyncError(async (req, res, next) => {
  const { message } = req.body;

  if (!message || message.trim().length === 0) {
    return next(new ErrorHandler("Reply message is required", 400));
  }

  const review = await Review.findById(req.params.reviewId).populate("property");

  if (!review) return next(new ErrorHandler("Review not found", 404));

  if (review.property.userId.toString() !== req.user._id.toString()) {
    return next(new ErrorHandler("Only host can reply", 403));
  }

  review.hostReply = {
    message,
    repliedAt: new Date(),
  };

  await review.save();

  res.status(200).json({
    success: true,
    message: "Reply added successfully",
    review,
  });
});

/* ======================================================
   5️⃣ Admin Hide / Unhide Review
====================================================== */
export const toggleReviewVisibility = catchAsyncError(async (req, res, next) => {
  const { isHidden, reason } = req.body;

  const review = await Review.findById(req.params.reviewId);
  if (!review) return next(new ErrorHandler("Review not found", 404));

  review.isHidden = isHidden;
  review.hiddenReason = isHidden ? reason : null;

  await review.save();
  await updatePropertyRating(review.property); 

  res.status(200).json({
    success: true,
    message: `Review ${isHidden ? "hidden" : "visible"} successfully`,
  });
});

/* ======================================================
   6️⃣ Review Analytics (Rounded)
====================================================== */
export const getReviewAnalytics = catchAsyncError(async (req, res) => {
  const propertyId = req.params.propertyId;

  const reviews = await Review.find({
    property: propertyId,
    isHidden: false,
    isVerifiedStay: true,
  });

  const analytics = {
    totalReviews: reviews.length,
    avgRating: Number(
      (
        reviews.reduce((s, r) => s + r.rating, 0) /
        (reviews.length || 1)
      ).toFixed(1)
    ),
    cleanlinessAvg: Number(
      (
        reviews.reduce((s, r) => s + r.cleanliness, 0) /
        (reviews.length || 1)
      ).toFixed(1)
    ),
    comfortAvg: Number(
      (
        reviews.reduce((s, r) => s + r.comfort, 0) /
        (reviews.length || 1)
      ).toFixed(1)
    ),
    serviceAvg: Number(
      (
        reviews.reduce((s, r) => s + r.service, 0) /
        (reviews.length || 1)
      ).toFixed(1)
    ),
    locationAvg: Number(
      (
        reviews.reduce((s, r) => s + r.location, 0) /
        (reviews.length || 1)
      ).toFixed(1)
    ),
  };

  res.status(200).json({
    success: true,
    analytics,
  });
});
