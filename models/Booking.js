import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    // 🔹 Guest (User) info
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",        // Refers to User model
      required: true,
    },

    // 🔹 Property info
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",    // Refers to Property model
      required: true,
    },

    guests: {
      adults: { type: Number, required: true },
      children: { type: Number, default: 0 },
      infants: { type: Number, default: 0 },
      pets: { type: Number, default: 0 }
    },

    // 🔹 Booking Dates
    checkIn: {
      type: Date,
      required: true,
    },
    checkOut: {
      type: Date,
      required: true,
    },

    // 🔹 Booking Status
    bookingStatus: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "completed"],
      default: "pending",
    },

    // 🔹 Payment Info
    paymentMethod: {
      type: String,
      enum: ["card", "upi", "netbanking", "wallet", "cash"],
      default: "card",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },

    // 🔹 Pricing Details
    subtotalAmount: {
      type: Number,
      required: true,
    },
    discountAmount: {
      type: Number,
      default: 0,
    },
    couponCode: {
      type: String,
      trim: true,
    },
    taxAmount: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
    },

    // 🔹 Audit Logs (who created/updated booking)
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",   // Could be guest or admin
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",   // Could be guest or admin
    },

    // 🔹 Status Change History (useful for admin panel & audit)
    statusHistory: [
      {
        status: {
          type: String,
          enum: ["pending", "confirmed", "cancelled", "completed"],
        },
        changedAt: {
          type: Date,
          default: Date.now,
        },
        changedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",  // User or Admin who changed status
        },
        note: String,   // Optional note (e.g., "Payment confirmed by admin")
      },
    ],

    // 🔹 Admin Actions (optional)
    handledByAdmin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },
    adminNote: {
      type: String,
      default: null,
      trim: true,
    },
  },
  { timestamps: true }
);

// ✅ Indexes for faster queries
bookingSchema.index({ guest: 1, property: 1, checkIn: 1 });
bookingSchema.index({ bookingStatus: 1, paymentStatus: 1 });

export const Booking = mongoose.model("Booking", bookingSchema);
