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
  cleanliness: {
    type: Number,
    required: [true, "Please provide a cleanliness rating (1 to 5)"],
    min: [1, "Minimum cleanliness rating is 1"],
    max: [5, "Maximum cleanliness rating is 5"],
  },
  comfort: {
    type: Number,
    required: [true, "Please provide a comfort rating (1 to 5)"],
    min: [1, "Minimum comfort rating is 1"],
    max: [5, "Maximum comfort rating is 5"],
  },
  service: {
    type: Number,
    required: [true, "Please provide a service rating (1 to 5)"],
    min: [1, "Minimum service rating is 1"],
    max: [5, "Maximum service rating is 5"],
  },
  location: {
    type: Number,
    required: [true, "Please provide a location rating (1 to 5)"],
    min: [1, "Minimum location rating is 1"],
    max: [5, "Maximum location rating is 5"],
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
  isVerifiedStay: {
    type: Boolean,
    default: false,
  },
  hostReply: {
    message: {
      type: String,
      maxlength: 500,
      trim: true,
    },
    repliedAt: Date,
    updatedAt: Date,
  },

  helpfulCount: {
    type: Number,
    default: 0,
  },
  isHidden: {
    type: Boolean,
    default: false,
  },
  hiddenReason: String,
  images: [
    {
      public_id: String,
      url: String,
    }
  ],
  sentiment: {
    type: String, // positive | neutral | negative
  },

}, {
  timestamps: true, // Adds createdAt and updatedAt
});

reviewSchema.index({ property: 1, user: 1 }, { unique: true });

export const Review = mongoose.model("Review", reviewSchema);
