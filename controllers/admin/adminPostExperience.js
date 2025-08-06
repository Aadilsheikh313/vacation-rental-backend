import { catchAsyncError } from "../../middlewares/catchAsyncError.js";
import ErrorHandler from "../../middlewares/errorMiddleware.js";
import cloudinary from "../../config/cloudinary.js";
import streamifier from "streamifier";
import { getCoordinatesFromLocation } from "../../config/mapApi.js";
import { Experience } from "../../models/ExperienceCategory.js";

// POST: Admin creating an experience
export const createExperienceAdmin = catchAsyncError(async (req, res, next) => {
    const {
        category,
        subcategory,
        title,
        description,
        country,
        city,
        location,
        bestTimeToVisit,
        history,
        tips
    } = req.body;

    // 🔒 Check if admin is logged in
    if (!req.admin) {
        return res.status(401).json({ message: "Unauthorized: Admin only" });
    }

    // ✅ Validate required fields
    const missingFields = [];
    if (!category) missingFields.push("category");
    if (!subcategory) missingFields.push("subcategory");
    if (!title) missingFields.push("title");
    if (!description) missingFields.push("description");
    if (!country) missingFields.push("country");
    if (!city) missingFields.push("city");
    if (!location) missingFields.push("location");

    if (missingFields.length > 0) {
        return next(new ErrorHandler(`Missing fields: ${missingFields.join(", ")}`, 400));
    }

    // ✅ Validate file
    if (!req.file) {
        return next(new ErrorHandler("Image is required. Please upload a file.", 400));
    }

    // ✅ Upload image to Cloudinary
    const streamUpload = (buffer) => {
        return new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                { folder: "experience_images" },
                (error, result) => {
                    if (result) resolve(result);
                    else reject(error);
                }
            );
            streamifier.createReadStream(buffer).pipe(stream);
        });
    };

    const result = await streamUpload(req.file.buffer);

    // ✅ Get coordinates from location
    const { lng, lat } = await getCoordinatesFromLocation(location);

    // ✅ Create Experience document
    const newExperience = new Experience({
        category,
        subcategory,
        title,
        description,
        country,
        city,
        location,
        coordinates: {
            type: "Point",
            coordinates: [lng, lat]
        },
        images: [
            {
                public_id: result.public_id,
                url: result.secure_url
            }
        ],
        bestTimeToVisit,
        history,
        tips,
        postedBy: req.admin._id
    });

    await newExperience.save();

    res.status(201).json({
        success: true,
        message: "Experience created successfully",
        adminposts: newExperience
    });
});
