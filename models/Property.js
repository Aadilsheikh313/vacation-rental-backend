import mongoose from "mongoose";

const propertySchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Please provide your Title!"],
  },

  description: {
    type: String,
    required: [true, "Please provide your description"],
  },

  image: {
    public_id: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
  },

  price: {
    type: Number,
    required: [true, "Please provide the property price!"],
    min: [1, "Minimum price must be 1 rupee!"],
  },

  category: {
    type: String,
    enum: [
      'Hotels',
      'Apartments',
      'Villas',
      'Guest Houses',
      'Resorts',
      'Farmhouses',
      'Cottages',
      'Bungalows',
      'Homestays',
      'Cabins',
      'Treehouses',
      'Boathouses',
      'Hostels',
      'Serviced Apartments',
      'Tent Stays / Camping',
      'Houseboats',
      'Luxury Stays',
    ],
    required: true,
  },

  country: {
    type: String,
    required: [true, "Property country is required!"],
  },

  city: {
    type: String,
    required: [true, "Property city is required!"],
    lowercase: true,
  },

  location: {
    type: String,
    required: [true, "Please provide the exact location"],
    lowercase: true,
    minLength: [10, "Property location must contain at least 10 characters!"],
  },

  coordinates: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number], // Format: [longitude, latitude]
      required: true,
    },
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
   inActiveAt: {
        type: Date,
        default: null,
    },
    ActiveAt: {
        type: Date,
        default: null,
    },
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
});

// Index for geospatial queries
propertySchema.index({ coordinates: "2dsphere" });

// Export model
export const Property = mongoose.model("Property", propertySchema);
