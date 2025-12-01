import mongoose from "mongoose";

const propertySchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Please provide your Title!"],
    trim: true,
  },

  description: {
    type: String,
    required: [true, "Please provide your description"],
    trim: true,
  },

  image: {
    public_id: { type: String, required: true },
    url: { type: String, required: true },
  },

  price: {
    type: Number,
    required: [true, "Please provide the property price!"],
    min: [1, "Minimum price must be 1 rupee!"],
  },

  category: {
    type: String,
    enum: [
      "Hotels",
      "Apartments",
      "Villas",
      "Guest Houses",
      "Resorts",
      "Farmhouses",
      "Cottages",
      "Bungalows",
      "Homestays",
      "Cabins",
      "Treehouses",
      "Boathouses",
      "Hostels",
      "Serviced Apartments",
      "Tent Stays / Camping",
      "Houseboats",
      "Luxury Stays",
      "Bar",
    ],
    required: true,
  },

  country: {
    type: String,
    required: [true, "Property country is required!"],
    trim: true,
  },

  city: {
    type: String,
    required: [true, "Property city is required!"],
    lowercase: true,
    trim: true,
  },

  location: {
    type: String,
    required: [true, "Please provide the exact location"],
    lowercase: true,
    minLength: [10, "Property location must contain at least 10 characters!"],
    trim: true,
  },

  coordinates: {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point",
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
    },
  },

  // New fields added here
  maxGuests: {
    type: Number,
    required: true,
    min: [1, "Minimum 1 guest required"],
    max: [8, "Maximum 8 guests allowed"],
  },

  roomSize: {
    value: { type: Number }, // e.g. 120
    unit: { type: String, enum: ["sqft", "m²"], default: "m²" }
  },

  facilities: [
    {
      type: String,
      enum: [
        "Free WiFi",
        "TV",
        "Gaming Console",
        "Coffee Machine",
        "Mini Bar",
        "AC",
        "Heating",
        "Room Service",
        "Private Bathroom",
        "Balcony",
        "Swimming Pool Access",
        "Fitness Center",
        "Spa Access",
        "Parking",
      ],
    },
  ],

  views: [
    {
      type: String,
      enum: ["City View", "Ocean View", "Mountain View", "City Skyline", "Garden View", "Pool View"],
    },
  ],

  privacy: {
    type: String,
    enum: ["Private", "Shared", "NoBalcony"],
    default: "Private",
  },

  workspace: {
    type: Boolean,
    default: false, // Desk & chair available?
  },

  directContact: {
    phone: {
      type: String,
      match: [/^(\+91[-\s]?)?[6-9]\d{9}$/, "Please enter a valid phone number"],
      trim: true,
    },

    email: {
      type: String,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
      trim: true,
    },

  },

  bedType: {
    type: String,
    enum: ["Single", "Double", "Queen", "King", "Twin", "Bunk Bed", "Sofa Bed"],
    required: true,
  },

  expired: {
    type: Boolean,
    default: false,
  },
  inActiveBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin",
    default: null,
  },
  inActiveAt: { type: Date, default: null },
  activeAt: { type: Date, default: null },
  inActiveReason: {
    type: String,
    default: null,
    trim: true,
    maxlength: 500,
  },
  ActiveNote: {
    type: String,
    default: null,
    trim: true,
    maxlength: 500,
  },

  lastChangedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },

  propertyPostedOn: {
    type: Date,
    default: Date.now,
  },

  userId: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: true,
  },

  avgRating: {
    type: Number,
    default: 0,
  },

  totalReviews: {
    type: Number,
    default: 0,
  },
  hostRazorpayAccount:{
    type: String,
    default: null,
  },
});

// Index for geospatial queries
propertySchema.index({ coordinates: "2dsphere" });
propertySchema.index({ city: 1 });
propertySchema.index({ price: 1 });
propertySchema.index({ category: 1 });
propertySchema.index({ avgRating: -1 });


export const Property = mongoose.model("Property", propertySchema);
