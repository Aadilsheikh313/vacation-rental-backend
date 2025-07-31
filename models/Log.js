import mongoose from "mongoose";

const logSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      enum: ["ban", "unban"],
      required: true,
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin", // ✅ Corrected from "User" to "Admin"
      required: true,
    },
    targetUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reason: {
      type: String,
      trim: true,
      default: null,
    },
    note: {
      type: String,
      trim: true,
      default: null,
    },
  },
  {
    timestamps: true, // ✅ createdAt and updatedAt fields
  }
);

export const Log = mongoose.model("Log", logSchema);
