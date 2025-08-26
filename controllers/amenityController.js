import { catchAsyncError } from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../middlewares/errorMiddleware.js";
import Amenity from "../models/Amenity.js";
import { Property } from "../models/Property.js";


export const createAmenities = catchAsyncError(async (req, res, next) => {
    const { propertyId, ...amenities } = req.body;

    const property = await Property.findById(propertyId);
    if (!property) {
        return next(new ErrorHandler("Property not found", 404));
    }

    // ✅ Only property owner can create amenities
    if (property.userId.toString() !== req.user._id.toString()) {
        return next(new ErrorHandler("Unauthorized to add amenities to this property", 403));
    }
    // check if amenities already exist for this property
    const exist = await Amenity.findOne({ propertyId });
    if (exist) {
        return next(new ErrorHandler("Amenities already exist for this property", 400));
    }
    const newAmenity = new Amenity({ propertyId, ...amenities });
    await newAmenity.save();

    // link property with amenities
    property.amenities = newAmenity._id;
    await property.save();

    res.status(201).json({
        success: true,
        message: "Amenity posted successfully.",
        newAmenity,
    })
});

// ✅ Get Amenities by Property
export const getAmenitiesByProperty = catchAsyncError(async (req, res, next) => {

    const { propertyId } = req.params;

    const amenities = await Amenity.findOne({ propertyId });
    if (!amenities) {
        return next(new ErrorHandler("Amenities not found", 404));
    }

    res.status(200).json({
        success: true,
        message: "Amenity feach sucessfully",
        amenities,
    });
});

// ✅ Update Amenities
export const updateAmenities = catchAsyncError(async (req, res, next) => {
    const { propertyId } = req.params;

    const property = await Property.findById(propertyId);
    if (!property) {
        return next(new ErrorHandler("Property not found", 404));
    }

    // ✅ Only property owner can update amenities
    if (property.userId.toString() !== req.user._id.toString()) {
        return next(new ErrorHandler("Unauthorized to update amenities of this property", 403));
    }

    const updated = await Amenity.findOneAndUpdate(
        { propertyId },
        { $set: req.body },
        { new: true }
    );

    if (!updated) {
        return next(new ErrorHandler("Amenities not found", 404));
    }

    res.status(200).json({
        success: true,
        message: "Amenity updated successfully",
        updated,
    });
});
