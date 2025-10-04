import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    razorpay_order_id: { type: String, required: true },
    razorpay_payment_id: { type: String, required: true },
    razorpay_signature: { type: String, required: true },

    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    amount: { type: Number, required: true },
    paymentMethod: {
      type: String,
      enum: ["card", "upi", "netbanking", "wallet", "cash", "qr"],
      default: "card",
    },

    // Optional fields for UPI/QR
    upiId: { type: String, default: null },
    qrCodeUrl: { type: String, default: null },

    status: { type: String, enum: ["success", "failed", "pending", "refunded"], default: "success" },
    refundedAmount: { type: Number, default: 0 },

    hostId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // property ka host
      required: true
    },

    hostRazorpayAccount: {
      type: String, // Connected Razorpay account ID of the host
      required: true
    },

    payoutStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending"
    },

    payoutAt: {
      type: Date,
      default: null
    },

    platformFee: {
      type: Number,
      default: 0 // 2% automatically calculate
    },
  },
  { timestamps: true }
);

export const Payment = mongoose.model("Payment", paymentSchema);
