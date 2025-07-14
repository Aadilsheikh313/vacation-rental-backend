import { catchAsyncError } from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../middlewares/errorMiddleware.js";
import { Review } from "../models/Review.js";
import {Property} from "../models/Property.js";


export const getAllReviewsForProperty = catchAsyncError(async (req, res) => {
  const reviews = await Review.find({ property: req.params.propertyId })
  .sort({ createdAt: -1 })
  .populate("user", "name avatar");
  res.status(200).json({
    success: true,
    reviews,
  });
});


export const postReview = catchAsyncError(async (req, res, next) => {
  console.log("🔔 Received review:", req.body, req.params, req.user);

  const { rating, comment } = req.body;
  const { propertyId } = req.params;

  if (!rating || !comment?.trim() || !propertyId) {
    return next(new ErrorHandler("Rating, comment, and property ID are required!", 400));
  }

  // 🔁 Check if user already submitted a review for this property
  const alreadyReviewed = await Review.findOne({
    user: req.user._id,
    property: propertyId,
  });

  if (alreadyReviewed) {
    return next(new ErrorHandler("You have already reviewed this property.", 400));
  }

  // ✅ Create review
  const review = await Review.create({
    rating,
    comment: comment.trim(),
    property: propertyId,
    user: req.user._id,
  });

  // 🔥 UPDATE PROPERTY'S AVERAGE RATING AND TOTAL REVIEWS
  const allReviews = await Review.find({ property: propertyId });

  const totalReviews = allReviews.length;
  const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews;

  await Property.findByIdAndUpdate(propertyId, {
    avgRating: avgRating.toFixed(1),
    totalReviews,
  });

  res.status(201).json({
    success: true,
    message: "Review posted successfully.",
    review,
  });
});

export const editReview = catchAsyncError(async(req, res, next) =>{
  const userId = req.user._id;
  const propertyId = req.params.propertyId;
  const reviewId = req.params.reviewId;
  const {rating, comment} = req.body;
  
  if(!rating || !comment) {
    return next(new ErrorHandler("Rating and comment are required for editing the review.", 400))
  }

  const review = await Review.findOne({_id: reviewId, property: propertyId});

  if(!review){
    return next(new ErrorHandler("Review not Found", 404));
  }

  if(review.user.toString() !== userId.toString()){
    return next(new ErrorHandler("You are not authorized to edit this review.", 403));
  }
  
  review.rating = rating;
  review.comment = comment.trim();
  await review.save();

  
  // Recalculate average rating and total reviews
  const allReviews = await Review.find({property: propertyId});

  const totalReviews = allReviews.length;
  const avgRating = allReviews.reduce((sum , r) => sum + r.rating, 0 ) / totalReviews;

  await Property.findByIdAndUpdate(propertyId, {
    avgRating: avgRating.toFixed(1),
    totalReviews,
  })

    res.status(200).json({
    success: true,
    message: "Review updated successfully.",
    review,
  });

})

export const deleteReview = catchAsyncError(async (req, res, next) => {
  const userId = req.user._id;
  const propertyId = req.params.propertyId;
  const reviewId = req.params.reviewId;

  // Check if review exists
  const review = await Review.findOne({ _id: reviewId, property: propertyId });

  if (!review) {
    return next(new ErrorHandler("Review not found", 404));
  }

  // Authorization: Only the review's author can delete
  if (review.user.toString() !== userId.toString()) {
    return next(new ErrorHandler("You are not authorized to delete this review.", 403));
  }

  // Delete review
  await review.deleteOne();

  // Update property's average rating and total reviews
  const allReviews = await Review.find({ property: propertyId });

  const totalReviews = allReviews.length;
  const avgRating = totalReviews === 0 ? 0 : allReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews;

  await Property.findByIdAndUpdate(propertyId, {
    avgRating: avgRating.toFixed(1),
    totalReviews,
  });

  res.status(200).json({
    success: true,
    message: "Review deleted successfully.",
  });
});
