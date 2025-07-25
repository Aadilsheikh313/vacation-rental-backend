import { catchAsyncError } from "../../middlewares/catchAsyncError.js";
import { Booking } from "../../models/Booking.js";
import { Payment } from "../../models/Payment.js";


export const getAllActiveBooking = catchAsyncError(async (req, res, next) => {
    const bookings = await Booking.find({
        bookingStatus: { $ne: "cancelled" },
    })
        .populate("user", "name email phone")
        .populate({
            path: "property",
            select: "title price location city image", // ensure these fields are selected
        })
        .lean();

    const populatedBookings = await Promise.all(
        bookings.map(async (booking) => {
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
