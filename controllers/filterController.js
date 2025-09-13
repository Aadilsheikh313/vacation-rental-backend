import { catchAsyncError } from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../middlewares/errorMiddleware.js";
import { Property } from "../models/Property.js";



export const PricesBaseFilter = catchAsyncError(async (req, res, next) => {
    const { sort } = req.query;

    let sortOption = {};

    if (sort === "lowToHigh") {
        sortOption = { price: 1 };
    } else if (sort === "highToLow") {
        sortOption = { price: -1 };
    } else if (sort === "ratingHighToLow") {
        sortOption = { avgRating: -1 };
    }

    const properties = await Property.find({ expired: false }).sort(sortOption);
    if (!properties || properties.length === 0) {
        return next(new ErrorHandler("No rooms match your selected filters. Please try again with different options.", 404));
    }

    res.status(200).json({
        success: true,
        count: properties.length,
        properties,
    })
})


export const FilterRooms = catchAsyncError(async (req, res, next) => {
    const { priceRange, capacity, view, features, bedType, sort } = req.body;

    let query = { expired: false };

    //Price Filter
    if (priceRange) {
        if (priceRange === "0-1000") {
            query.price = { $gte: 0, $lte: 1000 };
        } else if (priceRange === "1000-2000") {
            query.price = { $gte: 1000, $lte: 2000 };
        } else if (priceRange === "2000-4000") {
            query.price = { $gte: 2000, $lte: 4000 };
        } else if (priceRange === "4000+") {
            query.price = { $gte: 4000 };
        }
    }

    // Capacity Filter
    if (capacity) {
        if (capacity === "1-2") {
            query.maxGuests = { $gte: 1, $lte: 2 };
        } else if (capacity === "2-4") {
            query.maxGuests = { $gte: 2, $lte: 4 };
        } else if (capacity === "5+") {
            query.maxGuests = { $gte: 5 };
        }
    }

    //  View filter
    if (view && view !== "All") {
        query.views = view;
    }

    //  Features filter (array includes)
    if (features && features.length > 0) {
        query.facilities = { $all: features };
    }
    // Bed type filter
    if (bedType) {
        query.bedType = bedType;
    }

    // Sorting
    let sortOption = {};
    if (sort === "lowToHigh") {
        sortOption = { price: 1 };
    } else if (sort === "highToLow") {
        sortOption = { price: -1 };
    } else if (sort === "ratingHighToLow") {
        sortOption = { avgRating: -1 };
    } else {
        sortOption = { propertyPostedOn: -1 };
    }

    //  Final Query
    const properties = await Property.find(query).sort(sortOption);

    if (!properties || properties.length === 0) {
        return next(new ErrorHandler("No properties found", 404));
    }

    res.status(200).json({
        success: true,
        count: properties.length,
        properties,
    });
})