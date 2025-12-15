import mongoose from "mongoose";

const invoiceSchema = new mongoose.Schema({
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Booking",
    required: true,
  },
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
   propertyOwner: {          
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  invoiceUrl: {
    type: String, 
    required: true,
  },
  invoicePublicId: {
    type: String, 
  },
  invoiceNumber: {
    type: String,
    required: true,
    unique: true,
  },
  downloadedAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

export const Invoice = mongoose.model("Invoice", invoiceSchema);
