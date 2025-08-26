import mongoose from "mongoose";

const policySchema = new mongoose.Schema(
  {
      propertyId: { type: mongoose.Schema.Types.ObjectId, ref: "Property", required: true ,index: true,},

    checkIn: {
      start: { type: String, default: "3:00 PM" },
      end: { type: String, default: "12:00 AM" },
      earlyCheckIn: {
        allowed: { type: Boolean, default: true },
        note: { type: String, default: "Subject to availability" },
      },
    },
    checkOut: {
      start: { type: String, default: "6:00 AM" },
      end: { type: String, default: "11:00 AM" },
      lateCheckOut: {
        allowed: { type: Boolean, default: true },
        charges: { type: String, default: "Additional charges may apply" },
      },
    },

    cancellation: {
      freeCancellation: {
        durationHours: { type: Number, default: 48 }, // 48 hours before check-in
      },
      withinDuration: {
        penalty: { type: String, default: "1 night charge" },
      },
      noShow: {
        penalty: { type: String, default: "Full charge for entire stay" },
      },
      peakSeason: {
        requiredAdvanceDays: { type: Number, default: 7 },
        penalty: { type: String, default: "7-day advance cancellation required" },
      },
    },

    houseRules: {
      smoking: {
        allowed: { type: Boolean, default: false },
        note: { type: String, default: "Designated areas available" },
      },
      pets: {
        allowed: { type: Boolean, default: true },
        fee: { type: Number, default: 50 }, // Example pet fee
      },
      maxOccupancy: {
        type: Number,
        default: 4,
      },
      quietHours: {
        from: { type: String, default: "10:00 PM" },
        to: { type: String, default: "8:00 AM" },
      },
      validIdRequired: { type: Boolean, default: true },
    },

    paymentAndFees: {
      creditCardRequired: { type: Boolean, default: true },
      cityTax: {
        amount: { type: Number, default: 5 },
        unit: { type: String, default: "per night" },
        included: { type: Boolean, default: false },
      },
      resortFee: {
        amount: { type: Number, default: 25 },
        unit: { type: String, default: "per night" },
      },
      parking: {
        available: { type: Boolean, default: true },
        type: { type: String, enum: ["valet", "self"], default: "valet" },
        amount: { type: Number, default: 30 },
        unit: { type: String, default: "per night" },
      },
    },
  },
  { timestamps: true }
);

export default  mongoose.model("Policy",policySchema);
