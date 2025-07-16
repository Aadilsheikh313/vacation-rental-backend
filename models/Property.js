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
            required: true
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
        required: [true, "Property category is required! "],
    },
    country: {
        type: String,
        required: [true, "Property countery is required! "],
    },
    city: {
        type: String,
        required: [true, "Property city is required! "],
    },
    location: {
        type: String,
        required: [true, "Please provied exact location "],
        minLength: [10, "Property location must be contain at least 20 character!"],
    },
    coordinates: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point',
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
        },
    },
    expired: {
        type: Boolean,
        default: false,
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
propertySchema.index({ coordinates: "2dsphere" });
export const Property = mongoose.model("Property", propertySchema);