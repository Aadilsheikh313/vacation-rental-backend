import cron from 'node-cron';
import { Booking } from '../models/Booking';


cron.schedule('0 0 * * *', async () => { // Runs daily at 12:00 AM
    const today = new Date();

    await Booking.updateMany(
        { checkIn: { $gt: today }, bookingStatus: { $ne: "cancelled" } },
        { $set: { bookingType: "upcoming" } }
    );

    await Booking.updateMany(
        { checkIn: { $lte: today }, checkOut: { $gte: today }, bookingStatus: { $ne: "cancelled" } },
        { $set: { bookingType: "active" } }
    );

    await Booking.updateMany(
        { checkOut: { $lt: today }, bookingStatus: { $ne: "cancelled" } },
        { $set: { bookingType: "past" } }
    );

    console.log("✅ Bookings updated by cron at 12:00 AM");
});
