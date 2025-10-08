import { catchAsyncError } from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../middlewares/errorMiddleware.js";
import { Property } from "../models/Property.js";
import streamifier from "streamifier";
import cloudinary from "../config/cloudinary.js";
import { getCoordinatesFromLocation } from "../config/mapApi.js";
import { Host } from "../models/HostSchema.js";
import { User } from "../models/User.js";

/** ----------------- Helper Parsers ----------------- **/
const parseArray = (data) => {
  if (!data) return [];
  if (typeof data === "string") {
    try {
      return JSON.parse(data);
    } catch {
      return data.split(",").map((item) => item.trim());
    }
  }
  return Array.isArray(data) ? data : [];
};

const parseObject = (data) => {
  if (!data) return {};
  if (typeof data === "string") {
    try {
      return JSON.parse(data);
    } catch {
      return {};
    }
  }
  return typeof data === "object" ? data : {};
};

const parseRoomSize = (data) => {
  if (!data) return undefined;
  if (typeof data === "string") {
    try {
      data = JSON.parse(data);
    } catch {
      return undefined;
    }
  }
  if (typeof data === "object") {
    return {
      value: Number(data.value) || 0,
      unit: data.unit || "m²",
    };
  }
  return undefined;
};

/** ----------------- Get All Non-Expired ----------------- **/
export const getAllPropertyPosted = catchAsyncError(async (req, res, next) => {
  const property = await Property.find({ expired: false });

  res.status(200).json({
    success: true,
    property,
  });
});

/** ----------------- Post New Property ----------------- **/
export const postProperty = catchAsyncError(async (req, res, next) => {

  // 🧩 1️⃣ Check if user is authorized
  if (!req.user) {
    return next(new ErrorHandler("User not authorized or not found", 401));
  }

  const userId = req.user._id;
  console.log("userId:", userId);
  console.log("User role:", req.user.role);
  // 🧩 2️⃣ Check if user is a host
  if (req.user.role.trim().toLowerCase() !== "host") {
    return next(new ErrorHandler("Only hosts can add properties", 403));
}


  // ✅ 2. Check host verification status
  const host = await Host.findOne({ user: userId });
  console.log("Host found:", host);
  if (!host) {
    return next(new ErrorHandler("Host profile not found. Please complete your host profile.", 404));
  }
  log("Host verification status:", host.verificationStatus);
  if (host.verificationStatus !== "verified") {
    return next(new ErrorHandler("Your host profile is not verified yet. Please wait for admin approval before posting a property.",
      403));
  }

  let {
    title,
    description,
    price,
    category,
    country,
    city,
    location,
    maxGuests,
    roomSize,
    privacy,
    workspace,
    bedType,
    facilities,
    views,
    directContact,
  } = req.body;

  /** ✅ Validate required fields */
  if (!title || !description || !price || !category || !country || !city || !location || !maxGuests || !bedType) {
    return next(new ErrorHandler("Please fill out all required property details!", 400));
  }

  if (isNaN(price) || Number(price) <= 0) {
    return next(new ErrorHandler("Please enter a valid price greater than 0.", 400));
  }

  if (isNaN(maxGuests) || Number(maxGuests) < 1 || Number(maxGuests) > 8) {
    return next(new ErrorHandler("Guests must be between 1 and 8!", 400));
  }

  if (!req.file) {
    return next(new ErrorHandler("Image is required. Please upload a property image.", 400));
  }

  /** ☁️ Upload to Cloudinary */
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

  /** 📍 Convert location → coordinates */
  const { lng, lat } = await getCoordinatesFromLocation(location);

  /** 🛠 Parse Special Fields */
  facilities = parseArray(facilities);
  views = parseArray(views);
  directContact = parseObject(directContact);
  roomSize = parseRoomSize(roomSize);

  /** 🏠 Create Property */
  const newProperty = await Property.create({
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
    maxGuests,
    roomSize,
    facilities,
    views,
    privacy: privacy || "Private",
    workspace: workspace || false,
    directContact,
    bedType,
    userId: req.user._id,
  });

  res.status(201).json({
    success: true,
    message: "Property posted successfully.",
    newProperty,
  });
});

/** ----------------- Get Single Property ----------------- **/
export const getSingleProperty = catchAsyncError(async (req, res, next) => {
  const propertyId = req.params.id;
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

/** ----------------- Edit Property ----------------- **/
export const editProperty = catchAsyncError(async (req, res, next) => {
  const editPropertyId = req.params.id;
  const userId = req.user._id;

  const property = await Property.findById(editPropertyId);
  if (!property) return next(new ErrorHandler("Property not found", 404));

  if (property.userId.toString() !== userId.toString()) {
    return next(new ErrorHandler("Unauthorized to edit this property", 403));
  }

  let {
    title,
    description,
    price,
    category,
    country,
    city,
    location,
    maxGuests,
    roomSize,
    privacy,
    workspace,
    bedType,
    facilities,
    views,
    directContact,
  } = req.body;

  /** 🛠 Parse fields like in postProperty */
  facilities = parseArray(facilities);
  views = parseArray(views);
  directContact = parseObject(directContact);
  roomSize = parseRoomSize(roomSize);

  const updatedFields = {
    title: title || property.title,
    description: description || property.description,
    price: price || property.price,
    category: category || property.category,
    country: country || property.country,
    city: city || property.city,
    location: location || property.location,
    maxGuests: maxGuests || property.maxGuests,
    roomSize: roomSize || property.roomSize,
    facilities: facilities.length ? facilities : property.facilities,
    views: views.length ? views : property.views,
    privacy: privacy || property.privacy,
    workspace: workspace !== undefined ? workspace : property.workspace,
    directContact: Object.keys(directContact || {}).length ? directContact : property.directContact,
    bedType: bedType || property.bedType,
    expired: req.body.expired !== undefined ? req.body.expired : property.expired,
  };

  /** 🌍 Update coordinates if location changed */
  if (location && location !== property.location) {
    const { lng, lat } = await getCoordinatesFromLocation(location);
    updatedFields.coordinates = {
      type: "Point",
      coordinates: [lng, lat],
    };
  }

  /** ☁️ Handle image update */
  if (req.file) {
    if (property.image?.public_id) {
      await cloudinary.uploader.destroy(property.image.public_id);
    }

    const streamUpload = (buffer) =>
      new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "property_images" },
          (error, result) => (result ? resolve(result) : reject(error))
        );
        streamifier.createReadStream(buffer).pipe(stream);
      });

    const result = await streamUpload(req.file.buffer);
    updatedFields.image = {
      public_id: result.public_id,
      url: result.secure_url,
    };
  }

  /** ✅ Update property */
  const updatedProperty = await Property.findByIdAndUpdate(editPropertyId, updatedFields, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    message: "Property updated successfully.",
    updatedProperty,
  });
});

/** ----------------- Soft Delete ----------------- **/
export const softDeleteProperty = catchAsyncError(async (req, res, next) => {
  const deletePropertyId = req.params.id;
  const userId = req.user._id;

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
});

/** ----------------- Hard Delete ----------------- **/
export const hardDeleteProperty = catchAsyncError(async (req, res, next) => {
  const deletePropertyId = req.params.id;
  const userId = req.user._id;

  const property = await Property.findById(deletePropertyId);
  if (!property) return next(new ErrorHandler("Property is not Found!", 404));

  if (property.userId.toString() !== userId.toString()) {
    return next(new ErrorHandler("Unauthorized to hard delete this property", 403));
  }

  if (property.image?.public_id) {
    await cloudinary.uploader.destroy(property.image.public_id);
  }

  await Property.findByIdAndDelete(deletePropertyId);
  res.status(200).json({
    success: true,
    message: "Property deleted permanently!",
  });
});

/** ----------------- Reactivate Property ----------------- **/
export const reactiveProperty = catchAsyncError(async (req, res, next) => {
  const propertyId = req.params.id;
  const userId = req.user._id;

  const property = await Property.findById(propertyId);
  if (!property) return next(new ErrorHandler("Property not Found", 404));

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
});

/** ----------------- Get My Properties ----------------- **/
export const getMyProperties = catchAsyncError(async (req, res, next) => {
  const userId = req.user?._id;
  const properties = await Property.find({ userId }).lean();

  if (!properties || properties.length === 0) {
    return res.status(200).json({
      success: true,
      count: 0,
      message: "You have not posted any properties yet",
      properties: [],
    });
  }

  res.status(200).json({
    success: true,
    count: properties.length,
    properties,
  });
});

/** ----------------- Get My Expired ----------------- **/
export const getMyExpiredProperty = catchAsyncError(async (req, res, next) => {
  const userId = req.user._id;
  const property = await Property.find({ userId, expired: true });

  if (!property || property.length === 0) {
    return next(new ErrorHandler("No expired properties found for this user.", 404));
  }

  res.status(200).json({
    success: true,
    count: property.length,
    property,
  });
});

/** ----------------- Get Properties by Category ----------------- **/
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

/** ----------------- Get Properties by Near By User ----------------- **/
export const getNearbyProperties = async (req, res) => {
  try {
    const { latitude, longitude, distance } = req.query;
    if (!latitude || !longitude) {
      return res.status(400).json({ message: "Latitude & Longitude required" });
    }

    const radius = distance ? parseInt(distance) : 20000; // 20km in meters

    const properties = await Property.find({
      coordinates: {
        $geoWithin: {
          $centerSphere: [
            [parseFloat(longitude), parseFloat(latitude)],
            radius / 6378137, // meters / earth radius
          ],
        },
      },
    });

    res.status(200).json({ count: properties.length, properties });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

