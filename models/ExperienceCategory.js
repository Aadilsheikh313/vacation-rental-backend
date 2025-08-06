import mongoose from "mongoose";

const experienceSchema = new mongoose.Schema({
    category: {
        type: String,
        required: true,
        enum: [
            "Natural",
            "Cultural",
            "Urban",
            "Theme Park",
            "Wellness & Spiritual",
            "Adventure Sports",
            "Culinary",
            "Offbeat & Remote"
        ]
    },
    subcategory: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        minlength: 50
    },
    location: {
        type: String,
        required: true
    },
    country: {
        type: String,
        required: true
    },
    city: {
        type: String,
        required: true
    },
    coordinates: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number], // [lng, lat]
            required: true
        }
    },
    images: [
        {
            url: String,
            public_id: String
        }
    ],
    bestTimeToVisit: {
        type: String
    },
    history: {
        type: String
    },
    tips: {
        type: [String]
    },
    postedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Admin",
        required: true
    },
    postedOn: {
        type: Date,
        default: Date.now
    },
    isApproved: {
        type: Boolean,
        default: false
    }
});

// Geo index for map support
experienceSchema.index({ coordinates: '2dsphere' });

export const Experience = mongoose.model("Experience", experienceSchema);
