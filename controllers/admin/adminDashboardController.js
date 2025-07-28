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


// ✅ Get all upcoming bookings - Admin
export const getAdminAllUpcomingBooking = catchAsyncError(async (req, res, next) => {
    const today = new Date();

    // Find bookings where check-in is in the future and not cancelled
    const upcomingBookings = await Booking.find({
        bookingStatus: { $ne: "cancelled" },
        checkIn: { $gt: today },
    })
    .populate({
        path: "user", // Guest who booked
        select: "name email phone createdAt"
    })
    .populate({
        path: "property",
        select: "title price location city image userId",
        populate: {
            path: "userId", // Host who owns the property
            select: "name email phone createdAt"
        }
    })
    .sort({ checkIn: 1 }) // Optional: sort by upcoming date
    .lean();

    // Filter out bookings with missing properties (deleted from DB)
    const filteredBookings = upcomingBookings.filter(booking => booking.property !== null);

    // Construct full booking info
    const detailedUpcomingBookings = await Promise.all(
        filteredBookings.map(async (booking) => {
            const payment = await Payment.findOne({ bookingId: booking._id });

            
        const nights = Math.ceil(
            (new Date(booking.checkOut) - new Date(booking.checkIn)) / (1000 * 60 * 60 * 24)
        );
        const totalAmount = (booking.property?.price || 0) * nights;

            return {
                bookingId: booking._id,
                bookingStatus: booking.bookingStatus,
                createdAt: booking.createdAt, // When booking was made

                guest: {
                    id: booking.user?._id,
                    name: booking.user?.name,
                    email: booking.user?.email,
                    phone: booking.user?.phone,
                    joinedAt: booking.user?.createdAt,
                },

                host: {
                    id: booking.property?.userId?._id,
                    name: booking.property?.userId?.name,
                    email: booking.property?.userId?.email,
                    phone: booking.property?.userId?.phone,
                    joinedAt: booking.property?.userId?.createdAt,
                },

                property: {
                    id: booking.property?._id,
                    title: booking.property?.title,
                    price: booking.property?.price,
                    location: booking.property?.location,
                    city: booking.property?.city,
                    image: booking.property?.image,
                    totalAmount,
                },

                bookingDates: {
                    checkIn: booking.checkIn,
                    checkOut: booking.checkOut,
                    nights: Math.ceil((new Date(booking.checkOut) - new Date(booking.checkIn)) / (1000 * 60 * 60 * 24)),
                },

                paymentMethod: booking.paymentMethod || "Not specified",
                paymentStatus: booking.paymentStatus || "Pending",
                 paymentDetails: payment || {
                status: "Not Paid",
                method: "N/A"
            },
            };
        })
    );
    // ✅ Total of all upcoming bookings
const totalUpcomingAmount = detailedUpcomingBookings.reduce((sum, booking) => {
    return sum + (booking.property?.totalAmount || 0);
}, 0);

    res.status(200).json({
        success: true,
        count: detailedUpcomingBookings.length,
        totalUpcomingAmount,
        totalUpcomingCount: detailedUpcomingBookings.length,
        upcomingBookings: detailedUpcomingBookings,
    });
});

// ✅ Get all past bookings - Admin
export const getAdminAllPastBooking = catchAsyncError(async (req, res, next) => {
    const today = new Date();

    // 1. Find all past bookings where checkout date has passed and not cancelled
    const pastBookings = await Booking.find({
        bookingStatus: { $ne: "cancelled" },
        checkOut: { $lt: today },
    })
        .populate({
            path: "user", // Guest
            select: "name email phone createdAt"
        })
        .populate({
            path: "property",
            select: "title price location city image userId",
            populate: {
                path: "userId", // Host
                select: "name email phone createdAt"
            }
        })
        .sort({ checkOut: -1 }) // Most recent past bookings first
        .lean();

    // 2. Filter out bookings with deleted properties (optional safety)
    const filteredPastBookings = pastBookings.filter(booking => booking.property !== null);

    // 3. Build full details for each past booking
    const detailedPastBookings = await Promise.all(
        filteredPastBookings.map(async (booking) => {
            const payment = await Payment.findOne({ bookingId: booking._id });

            const nights = Math.ceil(
                (new Date(booking.checkOut) - new Date(booking.checkIn)) / (1000 * 60 * 60 * 24)
            );
            const totalAmount = (booking.property?.price || 0) * nights;

            return {
                bookingId: booking._id,
                bookingStatus: booking.bookingStatus,
                createdAt: booking.createdAt,

                guest: {
                    id: booking.user?._id,
                    name: booking.user?.name,
                    email: booking.user?.email,
                    phone: booking.user?.phone,
                    joinedAt: booking.user?.createdAt,
                },

                host: {
                    id: booking.property?.userId?._id,
                    name: booking.property?.userId?.name,
                    email: booking.property?.userId?.email,
                    phone: booking.property?.userId?.phone,
                    joinedAt: booking.property?.userId?.createdAt,
                },

                property: {
                    id: booking.property?._id,
                    title: booking.property?.title,
                    price: booking.property?.price,
                    city: booking.property?.city,
                    location: booking.property?.location,
                    image: booking.property?.image,
                    totalAmount,
                },

                bookingDates: {
                    checkIn: booking.checkIn,
                    checkOut: booking.checkOut,
                    nights,
                },

                paymentMethod: booking.paymentMethod || "Not specified",
                paymentStatus: booking.paymentStatus || "Pending",
                paymentDetails: payment || {
                    status: "Not Paid",
                    method: "N/A"
                },
            };
        })
    );

    // 4. Total amount earned from past bookings
    const totalPastAmount = detailedPastBookings.reduce((sum, booking) => {
        return sum + (booking.property?.totalAmount || 0);
    }, 0);

    // 5. Send response
    res.status(200).json({
        success: true,
        count: detailedPastBookings.length,
        totalPastAmount,
        pastBookings: detailedPastBookings,
    });
});
