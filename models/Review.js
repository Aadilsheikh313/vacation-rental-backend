import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
  rating: {
    type: Number,
    required: [true, "Please provide a rating (1 to 5)"],
    min: [1, "Minimum rating is 1"],
    max: [5, "Maximum rating is 5"],
  },
  comment: {
    type: String,
    trim: true,
    maxlength: [500, "Comment can’t exceed 500 characters"],
  },
  

  property: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Property",
    required: [true, "Property ID is required"],
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "User ID is required"],
  },
}, {
  timestamps: true, // Adds createdAt and updatedAt
});

reviewSchema.index({ property: 1, user: 1 });

export const Review = mongoose.model("Review", reviewSchema);
