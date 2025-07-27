import mongoose from "mongoose";
import validator from "validator";

const bookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "User is required for booking"],
  },
  property: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Property",
    required: [true, "Property is required for booking"],
  },
  checkIn: {
    type: Date,
    required: [true, "Please provide a check-in date"],
  },
  checkOut: {
    type: Date,
    required: [true, "Please provide a check-out date"],
    validate: {
      validator: function (value) {
        if (!this.checkIn) return true;
        return value > this.checkIn;
      },
      message: "Check-out must be after check-in",
    },
  },
  guests: {
    adults: {
      type: Number,
      required: true,
      min: [1, "At least one adult is required"],
    },
    children: { type: Number, default: 0 },
    infants: { type: Number, default: 0 },
    pets: { type: Number, default: 0 },
  },
  pricePerNight: {
    type: Number,
    required: true,
  },
  numberOfNights: {
    type: Number,
    required: true,
  },
  serviceFee: {
    type: Number,
    default: 0,
  },
  taxes: {
    type: Number,
    default: 0,
  },
  totalAmount: {
    type: Number,
    required: true,
  },
  bookingStatus: {
    type: String,
    enum: ["pending", "confirmed", "cancelled", "completed"],
    default: "pending",
  },

  paymentMethod: {
    type: String,
    enum: ["card", "upi", "paypal", "cash"],
    default: "cash",
  },
  paymentStatus: {
    type: String,
    enum: ["pending", "paid", "failed", "refunded"], // ✅ fix
    default: "pending",
  },
  cancelReason: {
    type: String,
    default: ""
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
  cancelledAt: {
    type: Date,
  },
  isRefunded: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true, // ✅ Correct placement here
});

bookingSchema.index({ user: 1, property: 1, checkIn: 1 });

export const Booking = mongoose.model("Booking", bookingSchema);
