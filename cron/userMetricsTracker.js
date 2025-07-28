import cron from 'node-cron';
import User from '../models/User.js';
import Metrics from '../models/Metrics.js'; // You must create this model

cron.schedule('0 0 * * *', async () => {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);

    const dailyActive = await User.countDocuments({
        lastLogin: { $gte: yesterday }
    });

    const currentlyOnline = await User.countDocuments({
        lastActiveAt: { $gte: new Date(Date.now() - 15 * 60 * 1000) } // 15 mins ago
    });

    const totalUsers = await User.countDocuments();

    const returningUsers = await User.countDocuments({
        lastLogin: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });

    const totalBookingAmount = await Booking.aggregate([
        { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);

    await Metrics.create({
        date: now,
        totalUsers,
        dailyActive,
        currentlyOnline,
        returningUsers,
        totalBookingAmount: totalBookingAmount[0]?.total || 0,
    });

    console.log("✅ Daily metrics updated in Metrics collection");
});
