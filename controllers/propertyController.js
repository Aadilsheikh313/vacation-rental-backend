import { catchAsyncError } from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../middlewares/errorMiddleware.js";
import { Property } from "../models/Property.js";
import streamifier from "streamifier";
import cloudinary from "../config/cloudinary.js";
import axios from "axios";
import { getCoordinatesFromLocation } from "../config/mapApi.js";

/**
 * GET all properties that are not expired
 */
export const getAllPropertyPosted = catchAsyncError(async (req, res, next) => {
    const property = await Property.find({ expired: false });

    res.status(200).json({
        success: true,
        property,
    });
});

/**
 * POST a new property listing
 */
export const postProperty = catchAsyncError(async (req, res, next) => {
    const {
        title,
        description,
        price,
        category,
        country,
        city,
        location,
    } = req.body;


    // Validate required fields
    if (!title || !description || !price || !category || !country || !city || !location) {
        return next(new ErrorHandler("Please fill out all required property details!", 400));
    }

    // Validate price is a positive number
    if (isNaN(price) || Number(price) <= 0) {
        return next(new ErrorHandler("Please enter a valid price greater than 0.", 400));
    }

    // Check if image file is uploaded
    if (!req.file) {
        return next(new ErrorHandler("Image is required. Please upload a property image.", 400));
    }

    // Function to upload image buffer to Cloudinary
    const streamUpload = (buffer) => {
        return new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                { folder: "property_images" },
                (error, result) => {
                    if (result) {
                        resolve(result);
                    } else {
                        reject(error);
                    }
                }
            );
            streamifier.createReadStream(buffer).pipe(stream);
        });
    };

    // Upload image to Cloudinary
    const result = await streamUpload(req.file.buffer);

    const { lng, lat } = await getCoordinatesFromLocation(location);

    // Create and save property in database
    const property = await Property.create({
        title,
        description,
        price,
        category,
        country,
        city,
        location,
        image: {
            public_id: result.public_id,
            url: result.secure_url,
        },
        coordinates: {
            type: "Point",
            coordinates: [lng, lat],
        },
        userId: req.user._id, // From authenticated user (set in auth middleware)
    });

    // Success response
    res.status(201).json({
        success: true,
        message: "Property posted successfully.",
        property,
    });
});


//get a single Property 

export const getSingleProperty = catchAsyncError(async (req, res, next) => {
    const propertyId = req.params.id;

    // 🔄 Populate user name and email from the User collection
    const property = await Property.findById(propertyId).populate("userId", "name email phone");


    if (!property) {
        return next(new ErrorHandler("Property not found", 404));
    }

    res.status(200).json({
        success: true,
        message: "Property successfully fetched",
        property,
    });
});


// property edit function 
export const editProperty = catchAsyncError(async (req, res, next) => {
    const editPropertyId = req.params.id;
    const userId = req.user._id; // authMiddleware

    const property = await Property.findById(editPropertyId);
    if (!property) return next(new ErrorHandler("Property not found", 404));

    if (property.userId.toString() !== userId.toString()) {
        return next(new ErrorHandler("Unauthorized to edit this property", 403));
    }

    const updatedFields = {
        title: req.body.title || property.title,
        description: req.body.description || property.description,
        price: req.body.price || property.price,
        category: req.body.category || property.category,
        country: req.body.country || property.country,
        city: req.body.city || property.city,
        location: req.body.location || property.location,
        expired: req.body.expired !== undefined ? req.body.expired : property.expired,
    };

    // If new image is uploaded
    if (req.file) {
        // Optional: delete old image from Cloudinary
        if (property.image?.public_id) {
            await cloudinary.uploader.destroy(property.image.public_id);
        }

        const streamUpload = (buffer) => {
            return new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    { folder: "property_images" },
                    (error, result) => {
                        if (result) resolve(result);
                        else reject(error);
                    }
                );
                streamifier.createReadStream(buffer).pipe(stream);
            });
        };

        const result = await streamUpload(req.file.buffer);

        updatedFields.image = {
            public_id: result.public_id,
            url: result.secure_url,
        };
    }

    const updatedProperty = await Property.findByIdAndUpdate(editPropertyId, updatedFields, {
        new: true,
        runValidators: true,
    });

    res.status(200).json({
        success: true,
        message: "Property updated successfully!",
        property: updatedProperty,
    });
});

// Soft Delete property Controller 
export const softDeleteProperty = catchAsyncError(async (req, res, next) => {
    const deletePropertyId = req.params.id;
    const userId = req.user._id; //authMiddelwera

    const property = await Property.findById(deletePropertyId);
    if (!property) return next(new ErrorHandler("Property not found!", 404));

    if (property.userId.toString() !== userId.toString()) {
        return next(new ErrorHandler("Unauthorized to soft delete this property", 403));
    }
    property.expired = true;
    await property.save();

    res.status(200).json({
        success: true,
        message: "Property soft-deleted (expired) successfully!",
    });
})

//hard Delete property Controller 
export const hardDeleteProperty = catchAsyncError(async (req, res, next) => {
    const deletePropertyId = req.params.id;
    const userId = req.user._id; //authMiddelwera

    const property = await Property.findById(deletePropertyId);
    if (!property) {
        return next(new ErrorHandler("Property is not Found!", 404));
    }

    if (property.userId.toString() !== userId.toString()) {
        return next(new ErrorHandler("Unauthorized to  hard delete this property", 403));
    }

    // ☁️ Cloudinary image delete
    if (property.image?.public_id) {
        await cloudinary.uploader.destroy(property.image.public_id);
    }

    //  hard delete Remove from DB
    await Property.findByIdAndDelete(deletePropertyId);
    // Instead of deleting the record
    //   property.isHardDeleted = true;
    //   await property.save();

    res.status(200).json({
        success: true,
        message: "Property marked as expired (soft deleted) successfully!",
    })
})

//Reactive Property (Only Owner Can Reactive the property )
export const reactiveProperty = catchAsyncError(async (req, res, next) => {
    const propertyId = req.params.id;
    const userId = req.user._id;

    const property = await Property.findById(propertyId);
    if (!property) {
        return next(new ErrorHandler("Property in not Found", 404));
    }
    if (property.userId.toString() !== userId.toString()) {
        return next(new ErrorHandler("Unauthorized to reactivate this property!", 403));
    }
    if (!property.expired) {
        return next(new ErrorHandler("Property is already active!", 400));
    }
    property.expired = false;
    await property.save();

    res.status(200).json({
        success: true,
        message: "Property reactivated successfully!",
        property,
    });
})

//Host get all Property only Host posted post 
export const getMyProperties = catchAsyncError(async (req, res, next) => {
    const userId = req.user?._id;
    if (!userId) {
        return next(new ErrorHandler("Unauthorized access", 401));
    }

    const properties = await Property.find({ userId }).lean();

    res.status(200).json({
        success: true,
        count: 0,
        properties: [],
    });
});

//get host only expired property Owner Only
export const getMyExpiredProperty = catchAsyncError(async (req, res, next) => {
    const userId = req.user._id; // ✅ Authenticated user's ID

    // ✅ Find all properties where: posted by user AND expired = true
    const property = await Property.find({ userId, expired: true });

    if (!property || property.length === 0) {
        return next(new ErrorHandler("No expired properties found for this user.", 404));
    }

    res.status(200).json({
        success: true,
        count: property.length,
        property, // ✅ return all matching properties
    });
});

// Get all non-expired properties by category
export const getPropertyByCategory = catchAsyncError(async (req, res, next) => {
    const { category } = req.params;
    const { city, location, priceMin, priceMax } = req.query;

    if (!category) {
        return next(new ErrorHandler("Category is required!", 400));
    }

    const formattedCategory = category.trim();
    const validCategories = Property.schema.path("category").enumValues;

    if (!validCategories.includes(formattedCategory)) {
        return next(new ErrorHandler("Invalid category!", 400));
    }

    // Optional filters
    const filter = {
        category: formattedCategory,
        expired: false,
    };

    if (city) filter.city = city.trim().toLowerCase();
    if (location) filter.location = location.trim().toLowerCase();

    if (priceMin || priceMax) {
        filter.price = {};
        if (priceMin) filter.price.$gte = Number(priceMin);
        if (priceMax) filter.price.$lte = Number(priceMax);
    }
    const properties = await Property.find(filter);

    res.status(200).json({
        success: true,
        count: properties.length,
        properties,
    });
});
