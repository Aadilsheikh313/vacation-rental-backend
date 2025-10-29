import mongoose from "mongoose";

const hostSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    verificationStatus: {
      type: String,
      enum: ["pending", "verified", "rejected", "reverified"],
      default: "pending",
    },

    verifiedAt: { type: Date, default: null },
    rejectedAt: { type: Date, default: null },
    rejectedReason: {
      type: String,
      default: null,
      trim: true,
      maxlength: 500,
    },

    appliedAt: { type: Date, default: Date.now() },
    lastUpdatedAt: { type: Date, default: Date.now() },
    adminNote: { type: String, default: null, trim: true, maxlength: 500 },

    governmentID: {
      type: String,
      enum: ["passport", "PAN", "voter-id", "driving-license", "Aadhaar", "Aadhaar-card", "other"],
      trim: true,
    },
    governmentIDNumber: { type: String, trim: true, maxlength: 100 },

    governmentIDImage: {
      public_id: { type: String, required: false },
      url: { type: String, required: false },
    },

    cancelledChequeImage: {
      public_id: { type: String, required: false },
      url: { type: String, required: false },
    },
    qrCode: {
      public_id: { type: String, required: false },
      url: { type: String, required: false },
    },
    payout: {
      razorpayAccountId: { type: String, default: null },
      upiId: { type: String, default: null },
      bankDetails: {
        accountHolderName: { type: String, default: null },
        accountNumber: { type: String, default: null },
        ifscCode: { type: String, default: null },
        bankName: { type: String, default: null },
        branchName: { type: String, default: null },
      },

      netBanking: {
        bankName: { type: String, default: null },
        accountHolderName: { type: String, default: null },
        accountNumber: { type: String, default: null },
        ifscCode: { type: String, default: null },
      },
      defaultPayoutMethod: {
        type: String,
        enum: ["razorpay", "upi", "bank", "qr", "card", "netbanking"],
        default: "card",
      },
    },

    earnings: {
      totalEarnings: { type: Number, default: 0 },
      pendingPayouts: { type: Number, default: 0 },
      completedPayouts: { type: Number, default: 0 },
      lastPayoutAt: { type: Date, default: null },
    },

    hostProperties: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Property",
      },
    ],

    rating: {
      avgRating: { type: Number, default: 0 },
      totalReviews: { type: Number, default: 0 },
    },

    audit: [
      {
        action: { type: String, enum: ["applied", "verified", "rejected","reverified", "banned", "unbanned"], required: true },
        performedBy: { type: mongoose.Schema.Types.ObjectId, refPath: "audit.performedByModel" },
        performedByModel: { type: String, enum: ["Admin", "User"] },
        note: { type: String, trim: true, maxlength: 500 },
        adminDetails: {
          name: { type: String, trim: true },
          email: { type: String, trim: true },
          phone: { type: String, trim: true },
        },
        date: { type: Date, default: Date.now },
      },
    ],

  },
  { timestamps: true }
);


hostSchema.index({ verificationStatus: 1, "earnings.totalEarnings": -1 });

hostSchema.pre("save", function (next) {
  this.lastUpdatedAt = Date.now();
  next();
});


export const Host = mongoose.model("Host", hostSchema);
