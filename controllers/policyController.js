import { catchAsyncError } from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../middlewares/errorMiddleware.js";
import Policy from "../models/Policy.js";
import { Property } from "../models/Property.js";

/** ---------------- Create Policy ---------------- **/
export const createPolicy = catchAsyncError(async (req, res, next) => {
    const { propertyId, ...policyData } = req.body;

    const property = await Property.findById(propertyId);
    if (!property) {
        return next(new ErrorHandler("Property not found", 404));
    }

    // ✅ Only property owner can create policy
    if (property.userId.toString() !== req.user._id.toString()) {
        return next(new ErrorHandler("Unauthorized to add policy to this property", 403));
    }

    // ✅ Check if policy already exists for this property
    const exist = await Policy.findOne({ propertyId });
    if (exist) {
        return next(new ErrorHandler("Policy already exists for this property", 400));
    }

    const newPolicy = new Policy({ propertyId, ...policyData });
    await newPolicy.save();

    // ✅ Link policy with property (optional if you want reference in property model)
    property.policy = newPolicy._id;
    await property.save();

    res.status(201).json({
        success: true,
        message: "Policy created successfully",
        newPolicy,
    });
});

/** ---------------- Get Policy by Property ---------------- **/
export const getPolicyByProperty = catchAsyncError(async (req, res, next) => {
    const { propertyId } = req.params;

    const policy = await Policy.findOne({ propertyId });
    if (!policy) {
        return next(new ErrorHandler("Policy not found", 404));
    }

    res.status(200).json({
        success: true,
        message: "Policy fetched successfully",
        policy,
    });
});

/** ---------------- Update Policy ---------------- **/
export const updatePolicy = catchAsyncError(async (req, res, next) => {
    const { propertyId } = req.params;

    const property = await Property.findById(propertyId);
    if (!property) {
        return next(new ErrorHandler("Property not found", 404));
    }

    // ✅ Only property owner can update policy
    if (property.userId.toString() !== req.user._id.toString()) {
        return next(new ErrorHandler("Unauthorized to update policy of this property", 403));
    }

    const updatedPolicy = await Policy.findOneAndUpdate(
        { propertyId },
        { $set: req.body },
        { new: true }
    );

    if (!updatedPolicy) {
        return next(new ErrorHandler("Policy not found", 404));
    }

    res.status(200).json({
        success: true,
        message: "Policy updated successfully",
        updatedPolicy,
    });
});
