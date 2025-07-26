import { catchAsyncError } from "../../middlewares/catchAsyncError.js";
import { Booking } from "../../models/Booking.js";
import { Payment } from "../../models/Payment.js";


export const getAllActiveBooking = catchAsyncError(async (req, res, next) => {
    const bookings = await Booking.find({ bookingStatus: { $ne: "cancelled" } })
        .populate("user", "name email phone")
        .populate("property", "title location city price")
        .lean(); // returns plain JS objects

    // Attach payment method info from Payment model
    const populatedBookings = await Promise.all(
        bookings.map(async (booking) => {
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