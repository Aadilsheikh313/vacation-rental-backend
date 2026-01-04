import { catchAsyncError } from "../../middlewares/catchAsyncError.js";
import { Property } from "../../models/Property.js";
import { Review } from "../../models/Review.js";
import { Booking } from "../../models/Booking.js";
import { Payment } from "../../models/Payment.js";

//Get all posted property a admin
export const getAllPropertyAdmin = catchAsyncError(async (req, res, next) => {
    const AdmingetAllProperty = await Property.find({})
        .populate("userId", "name email phone createdAt");
    res.status(200).json({
        success: true,
        AdmingetAllProperty,
    });
});

// ✅ Admin: Get single property with full details
export const getSinglePropertyAdmin = catchAsyncError(async (req, res, next) => {
    const propertyId = req.params.id;
    // ✅ 1. Get Property Details
    const property = await Property.findById(propertyId)
        .populate("userId", "name email phone createdAt description")
        .lean();

    if (!property) {
        return res.status(404).json({
            success: false,
            message: "Property not found",
        });
    }
    // ✅ 2. Get All Reviews for this property
    const reviews = await Review.find({ property: propertyId })
        .populate("user", "name email")
        .sort({ createdAt: -1 }) // latest first
        .lean();

    // ✅ 3. Get All Bookings for this property
    const bookings = await Booking.find({ property: propertyId })
        .populate("user", "name email phone")
        .sort({ createdAt: -1 })
        .lean();

    // ✅ 4. Get All Payments for this property
    const payments = await Payment.find({
        bookingId: { $in: bookings.map(b => b._id) },
        status: "success"
    }).lean();

    // ✅ 5. Calculate total revenue
    const totalRevenue = payments.reduce((sum, pay) => sum + pay.amount, 0);

    // ✅ 6. Total booking count
    const totalBookings = bookings.length;
    // ✅ 7. Average rating from reviews
    const avgRating = reviews.length > 0
        ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
        : 0;

    const completedBookings = bookings.filter(
        b => b.bookingStatus === "completed"
    ).length;

    const cancelledBookings = bookings.filter(
        b => b.bookingStatus === "cancelled"
    ).length;

    const onlineRevenue = bookings
        .filter(b => b.paymentMethod === "razorpay" && b.paymentStatus === "paid")
        .reduce((sum, b) => sum + b.totalAmount, 0);

    const cashRevenue = bookings
        .filter(b => b.paymentMethod === "cash" && b.paymentStatus === "paid")
        .reduce((sum, b) => sum + b.totalAmount, 0);


    const totalTax = bookings.reduce(
        (sum, b) => sum + (b.taxAmount || 0),
        0
    );
    const serviceCharge = payments.reduce(
        (sum, p) => sum + (p.platformFee || 0),
        0
    );

    // ✅ 8. Final Response
    res.status(200).json({
        success: true,
        property,
        reviews,
        bookings,
        payments,

        totalBookings,
        completedBookings,
        cancelledBookings,

        totalRevenue,
        onlineRevenue,
        cashRevenue,

        totalTax,
        serviceCharge,

        avgRating,
    });

});
