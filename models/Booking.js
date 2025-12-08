// models/Booking.js
import mongoose from "mongoose";

// Sub-schema for guest counts
const guestSchema = new mongoose.Schema(
  {
    adults: {
      type: Number,
      required: [true, "Adults count is required"],
      min: [1, "At least 1 adult is required"],
    },
    children: { type: Number, default: 0, min: 0 },
    infants: { type: Number, default: 0, min: 0 },
    pets: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const bookingSchema = new mongoose.Schema(
  {
    // 🔹 Link user + property
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
      index: true,
    },

    // 🔹 Stay details
    checkIn: { type: Date, required: true },
    checkOut: { type: Date, required: true },

    // 🔹 Guest details
    guests: { type: guestSchema, required: true },

    // 🔹 Booking flow statuses
    bookingStatus: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "completed"],
      default: "pending",
    },

    paymentMethod: {
      type: String,
      enum: [
        "card",
        "upi",
        "netbanking",
        "wallet",
        "cash",
        "qr",
        "razorpay",
        null,
      ],
      default: null,
    },

    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },

    // 🆔 Payment Gateway ID
    paymentId: { type: String, default: null },

    // 🔹 Auto-generated booking code
    bookingCode: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },

    // 💵 Pricing data (server-calculated)
    numberOfNights: { type: Number, required: true },
    pricePerNight: { type: Number, required: true },
    subtotalAmount: { type: Number, required: true },
    discountAmount: { type: Number, default: 0 },
    couponCode: { type: String, trim: true },
    taxAmount: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },

    // 🔐 Admin actions
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    statusHistory: [
      {
        status: {
          type: String,
          enum: ["pending", "confirmed", "cancelled", "completed"],
        },
        changedAt: { type: Date, default: Date.now },
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        note: { type: String, trim: true },
      },
    ],

    handledByAdmin: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
    adminNote: { type: String, trim: true },

    // 🧾 Razorpay account for settlements
    hostRazorpayAccount: { type: String, trim: true },

    action: {
      enum: ["accept", "cancel"],
      type: String,
      default: null
    },

    // 🔥 Update History Log (Audit Trail)
updateHistory: [
  {
    updatedAt: { type: Date, default: Date.now },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // Old → New Date
    oldCheckIn: Date,
    newCheckIn: Date,
    oldCheckOut: Date,
    newCheckOut: Date,

    // Old → New Guests
    oldGuests: { type: guestSchema },
    newGuests: { type: guestSchema },

    // Optional history note
    note: { type: String, trim: true },
  },
],

  },
  { timestamps: true }
);

// 📌 Indexes for performance
bookingSchema.index({ bookingStatus: 1 });
bookingSchema.index({ paymentStatus: 1 });

// ⚠ Pre-save validations
bookingSchema.pre("save", function (next) {
  if (this.checkOut <= this.checkIn) {
    return next(new Error("Check-out date must be after check-in date"));
  }

  if (!this.bookingCode) {
    this.bookingCode = `VRL-${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 7)
      .toUpperCase()}`;
  }

  if (this.totalAmount < 0) {
    return next(new Error("Invalid total amount"));
  }

  next();
});

export const Booking = mongoose.model("Booking", bookingSchema);
