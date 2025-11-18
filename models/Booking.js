import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },

    guests: {
      adults: { type: Number, required: true },
      children: { type: Number, default: 0 },
      infants: { type: Number, default: 0 },
      pets: { type: Number, default: 0 },
    },

    checkIn: { type: Date, required: true },
    checkOut: { type: Date, required: true },

    bookingStatus: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "completed"],
      default: "pending",
    },

    paymentMethod: {
      type: String,
      enum: ["card", "upi", "netbanking", "wallet", "cash", "qr"],
      default: "card",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },

    // 🔹 Payment Details
    paymentId: { type: String, default: null }, // Razorpay Payment ID
    bookingCode: { type: String, unique: true, sparse: true }, // Eg: VRL2025-123XYZ

    subtotalAmount: { type: Number, required: true },
    discountAmount: { type: Number, default: 0 },
    couponCode: { type: String, trim: true },
    taxAmount: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    numberOfNights: {
      type: Number,
      required: true,
    },
    pricePerNight: {
      type: Number,
    },


    statusHistory: [
      {
        status: {
          type: String,
          enum: ["pending", "confirmed", "cancelled", "completed"],
        },
        changedAt: { type: Date, default: Date.now },
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        note: String,
      },
    ],

    handledByAdmin: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
    adminNote: { type: String, default: null, trim: true },
  },
  { timestamps: true }
);

// 🔥 Index Optimization
bookingSchema.index({ user: 1, property: 1, checkIn: 1 });
bookingSchema.index({ bookingStatus: 1, paymentStatus: 1 });
bookingSchema.index({ bookingCode: 1 }); // For booking reference searches

// 🔒 Validation
bookingSchema.pre("save", function (next) {
  if (this.checkOut <= this.checkIn) {
    return next(new Error("Check-out date must be after check-in date"));
  }

  // Generate unique bookingCode only if not already set
  if (!this.bookingCode) {
    this.bookingCode = `VRL-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
  }
  next();
});


export const Booking = mongoose.model("Booking", bookingSchema);
