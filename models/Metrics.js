import mongoose from 'mongoose';

const metricsSchema = new mongoose.Schema({
    date: {
        type: Date,
        default: Date.now
    },

     // 👥 Guest (User) Metrics
    totalGuests: { type: Number, default: 0 },
    newGuestsToday: { type: Number, default: 0 },
    returningGuests: { type: Number, default: 0 },
    dailyActiveGuests: { type: Number, default: 0 },
    onlineGuests: { type: Number, default: 0 },
    logoutGuests: { type: Number, default: 0 },
    bannedGuests: { type: Number, default: 0 },

    // 👨‍💼 Host Metrics
    totalHosts: { type: Number, default: 0 },
    newHostsToday: { type: Number, default: 0 },
    activeHosts: { type: Number, default: 0 },
    onlineHosts: { type: Number, default: 0 },
    logoutHosts: { type: Number, default: 0 },
    bannedHosts: { type: Number, default: 0 },

    // 💼 Booking Metrics
    totalBookingAmount: { type: Number, default: 0 },
    bookingsToday: { type: Number, default: 0 },
    cancelledToday: { type: Number, default: 0 },

    // 🏠 Host/Property Metrics
    activeHosts: { type: Number, default: 0 },
    totalProperties: { type: Number, default: 0 }
});

export default mongoose.model("Metrics", metricsSchema);
 