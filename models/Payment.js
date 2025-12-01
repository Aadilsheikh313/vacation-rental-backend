// models/Payment.js
import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    // 🔗 Relational mapping
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // 💵 Amount paid by customer
    amount: {
      type: Number,
      required: true,
      min: [1, "Amount must be greater than zero"],
    },

    // 🔹 Payment method used
    paymentMethod: {
      type: String,
      enum: ["card", "upi", "netbanking", "wallet", "cash", "qr", "razorpay"],
      required: true,
    },


    // 🔹 Razorpay details (only required for Razorpay)
    razorpay_order_id: { type: String },
    razorpay_payment_id: { type: String },
    razorpay_signature: { type: String },

    // 🔹 UPI / QR support
    upiId: { type: String, trim: true },
    qrCodeUrl: { type: String, trim: true },

    // 🔹 Payment state
    status: {
      type: String,
      enum: ["pending", "success", "failed", "refunded"],
      default: "pending",
      index: true,
    },
    paymentStatusMessage: { type: String, trim: true },
    transactionId: { type: String, trim: true },

    payoutStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "not_applicable"],
      default: "not_applicable",
    },

    // 🔁 Refund data
    refundedAmount: { type: Number, default: 0 },
    refundReason: { type: String, trim: true },
    refundedAt: { type: Date },

    // 🧾 Host settlement
    hostId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    hostRazorpayAccount: { type: String, trim: true },

    payoutAt: { type: Date },

    // 🔄 Payment gateway used
    paymentGateway: {
      type: String,
      enum: ["Razorpay", "Cash", "Custom"],
      default: "Razorpay",
    },

    // 💰 Platform charges
    platformFee: { type: Number, default: 0 },

    // 🔒 Verification for manual approval
    verified: { type: Boolean, default: false },
    verifiedAt: { type: Date },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
  },
  { timestamps: true }
);

// 📌 Smart indexes for performance
paymentSchema.index({ paymentMethod: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ transactionId: 1 });

// ⚠️ Pre-save validation
paymentSchema.pre("save", function (next) {
  if (this.amount <= 0) {
    return next(new Error("Payment amount must be greater than zero"));
  }

  if (this.paymentMethod === "razorpay") {
    if (
      !this.razorpay_order_id ||
      !this.razorpay_payment_id ||
      !this.razorpay_signature
    ) {
      return next(new Error("Razorpay transaction details are missing"));
    }
  }

  next();
});

export const Payment = mongoose.model("Payment", paymentSchema);
