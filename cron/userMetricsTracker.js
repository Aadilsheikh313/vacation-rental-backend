import cron from 'node-cron';
import Metrics from '../models/Metrics.js';
import { Booking } from '../models/Booking.js';
import { User } from '../models/User.js';
import Property from '../models/Property.js';

cron.schedule('0 0 * * *', async () => {
    try {
        const now = new Date();
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);

        const startOfDay = new Date(now.setHours(0, 0, 0, 0));

         // 🧍‍♂️ Total registered users
        const totalUsers = await User.countDocuments();

        // 🧍‍♂️ USER METRICS (Guest + Host separated)
        const totalGuests = await User.countDocuments({ role: { $in: ["guest", "Guest"] } });
        const newGuestsToday = await User.countDocuments({ role: { $in: ["guest", "Guest"] }, createdAt: { $gte: startOfDay } });
        const returningGuests = await User.countDocuments({ role: { $in: ["guest", "Guest"] }, lastLogin: { $lt: startOfDay } });
        const dailyActiveGuests = await User.countDocuments({ role: { $in: ["guest", "Guest"] }, lastLogin: { $gte: startOfDay } });
        const onlineGuests = await User.countDocuments({ role: { $in: ["guest", "Guest"] }, lastActiveAt: { $gte: new Date(Date.now() - 15 * 60 * 1000) } });
        const logoutGuests = await User.countDocuments({ role: { $in: ["guest", "Guest"] }, lastActiveAt: { $lt: new Date(Date.now() - 15 * 60 * 1000) } });
        const bannedGuests = await User.countDocuments({ role: { $in: ["guest", "Guest"] }, isBanned: true });

        const totalHosts = await User.countDocuments({ role: { $in: ["host", "Host"] } });
        const newHostsToday = await User.countDocuments({ role: { $in: ["host", "Host"] }, createdAt: { $gte: startOfDay } });
        const activeHosts = await User.countDocuments({ role: { $in: ["host", "Host"] }, lastLogin: { $gte: yesterday } });
        const onlineHosts = await User.countDocuments({ role: { $in: ["host", "Host"] }, lastActiveAt: { $gte: new Date(Date.now() - 15 * 60 * 1000) } });
        const logoutHosts = await User.countDocuments({ role: { $in: ["host", "Host"] }, lastActiveAt: { $lt: new Date(Date.now() - 15 * 60 * 1000) } });
        const bannedHosts = await User.countDocuments({ role: { $in: ["host", "Host"] }, isBanned: true });

        // 💰 BOOKING METRICS
        const totalBookingAmountAgg = await Booking.aggregate([
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);
        const totalBookingAmount = totalBookingAmountAgg[0]?.total || 0;

        const bookingsToday = await Booking.countDocuments({ createdAt: { $gte: startOfDay } });

        // Save Metrics
        await Metrics.create({
            totalGuests,
            newGuestsToday,
            returningGuests,
            dailyActiveGuests,
            onlineGuests,
            logoutGuests,
            bannedGuests,

            totalHosts,
            newHostsToday,
            activeHosts,
            onlineHosts,
            logoutHosts,
            bannedHosts,

            totalBookingAmount,
            bookingsToday
        });

        console.log("✅ Daily metrics updated successfully");
    } catch (error) {
        console.error("❌ Metrics Cron Job Error:", error);
    }
});
