import { catchAsyncError } from "../../middlewares/catchAsyncError.js";
import { Booking } from "../../models/Booking.js";
import { Payment } from "../../models/Payment.js";


export const getAllActiveBooking = catchAsyncError(async (req, res, next) => {
    const bookings = await Booking.find({
         userId: req.user._id,
        bookingStatus: { $ne: "cancelled" },
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
