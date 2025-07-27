import { catchAsyncError } from "../../middlewares/catchAsyncError.js";
import { Booking } from "../../models/Booking.js";
import { Payment } from "../../models/Payment.js";



export const getAllAminBooking = catchAsyncError(async (req, res, next) => {
    const bookings = await Booking.find({
    bookingStatus: { $ne: "cancelled" }  
})
        .populate("user", "name email phone")
        .populate({
            path: "property",
            select: "title price location city image userId", // ✅ added userId
            populate: {
                path: "userId",  // ✅ nested populate
                select: "name email phone createdAt"
            }
        })
        .lean();
    // ✅ Filter out bookings with deleted properties
    const filteredBookings = bookings.filter(booking => booking.property !== null);

    const populatedBookings = await Promise.all(
        filteredBookings.map(async (booking) => {
            // ✅ Now booking is defined — safe to log
            const payment = await Payment.findOne({ bookingId: booking._id });

            return {
                ...booking,
                paymentMethod: booking.paymentMethod,
                paymentStatus: booking.paymentStatus,
                paymentDetails: payment || null,
            };
        })
    );

    res.status(200).json({
        success: true,
        bookings: populatedBookings,
    });
});

//Get all active booking
export const getAdminAllActiveBooking = catchAsyncError(async (req, res, next) => {
    const today = new Date();

    const bookings = await Booking.find({
        bookingStatus: { $ne: "cancelled" },
        checkIn: { $lte: today },
        checkOut: { $gte: today },
    })
    .populate({
        path: "user", // Guest who booked
        select: "name email phone"
    })
    .populate({
        path: "property",
        select: "title price location city image userId",
        populate: {
            path: "userId", // Host who posted the property
            select: "name email phone"
        }
    })
    .lean();


    const activeBookings = await Promise.all(bookings.map(async booking => {
        const payment = await Payment.findOne({ bookingId: booking._id });

        return {
            bookingId: booking._id,
            guest: booking.user,
            host: booking.property?.userId || null,
            property: {
                title: booking.property?.title,
                price: booking.property?.price,
                city: booking.property?.city,
                location: booking.property?.location,
                image: booking.property?.image,
            },
            bookingDates: {
                checkIn: booking.checkIn,
                checkOut: booking.checkOut,
            },
            paymentMethod: booking.paymentMethod,
            paymentStatus: booking.paymentStatus,
            paymentDetails: payment || null,
        };
    }));

    res.status(200).json({
        success: true,
        count: activeBookings.length, 
        activeBookings,
    });
});


// ✅ Get all cancelled bookings - Admin
export const getAdminAllCancelBooking = catchAsyncError(async (req, res, next) => {
    // 1. Get bookings where bookingStatus is "cancelled"
    const cancelledBookings = await Booking.find({ bookingStatus: "cancelled" })
        .populate({
            path: "user", // Guest
            select: "name email phone"
        })
        .populate({
            path: "property", // Property
            select: "title price location city image userId",
            populate: {
                path: "userId", // Host (owner)
                select: "name email phone"
            }
        })
        .lean();

    // 2. Filter out bookings with missing/deleted properties (optional safety)
    const filteredBookings = cancelledBookings.filter(booking => booking.property !== null);

    // 3. Build full details for each booking
    const detailedCancelledBookings = await Promise.all(filteredBookings.map(async (booking) => {
        const payment = await Payment.findOne({ bookingId: booking._id });

        return {
            bookingId: booking._id,
            guest: booking.user,
            host: booking.property?.userId || null,
            property: {
                title: booking.property?.title,
                price: booking.property?.price,
                city: booking.property?.city,
                location: booking.property?.location,
                image: booking.property?.image,
            },
            bookingDates: {
                checkIn: booking.checkIn,
                checkOut: booking.checkOut,
            },
            paymentMethod: booking.paymentMethod,
            paymentStatus: booking.paymentStatus,
            paymentDetails: payment || null,
            cancelReason: booking.cancelReason || "Not specified", // optional field
            cancelledAt: booking.updatedAt, // approximate cancel time
        };
    }));

    // 4. Send response
    res.status(200).json({
        success: true,
        count: detailedCancelledBookings.length,
        cancelledBookings: detailedCancelledBookings,
    });
});
