import mongoose from "mongoose";

const companySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true },  
    phone: { type: String, required: true, trim: true },
    website: { type: String, trim: true },
    establishedYear: { type: Number, trim: true },
    numberOfEmployees: { type: Number, trim: true },
    industry: { type: String, trim: true },
    description: { type: String, trim: true },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);  
export const Company = mongoose.model("Company", companySchema);
