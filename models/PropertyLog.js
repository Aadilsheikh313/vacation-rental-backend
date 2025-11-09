import mongoose from "mongoose";

const PropertylogSchema = new mongoose.Schema(
  {
    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property", // ✅ Link log directly to a Property
      required: true,
    },
    action: {
      type: String,
      enum: ["Active", "inActive"],
      required: true,
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin", // ✅ Admin who performed the action
      required: true,
    },
    targetUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // ✅ Property owner (host)
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
    timestamps: true, // ✅ Adds createdAt & updatedAt
  }
);

export const PropertysLog = mongoose.model("PropertyLog", PropertylogSchema);
