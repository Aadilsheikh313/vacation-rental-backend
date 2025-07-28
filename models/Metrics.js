import mongoose from 'mongoose';

const metricsSchema = new mongoose.Schema({
    date: Date,
    totalUsers: Number,
    dailyActive: Number,
    currentlyOnline: Number,
    returningUsers: Number,
    totalBookingAmount: Number,
});

export default mongoose.model("Metrics", metricsSchema);
