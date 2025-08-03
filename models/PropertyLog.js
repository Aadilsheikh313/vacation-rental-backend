import mongoose from "mongoose";

const PropertylogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      enum: ["Active", "inActive"],
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

export const PropertysLog = mongoose.model("PropertyLog", PropertylogSchema);
