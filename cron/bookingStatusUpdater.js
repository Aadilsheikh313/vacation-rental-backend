import cron from "node-cron";
import { Booking } from "../models/Booking.js";

cron.schedule(
  "0 */2 * * *", // ⏱ every 2 hours (not only midnight)
  async () => {
    try {
      const now = new Date();

      const result = await Booking.updateMany(
        {
          checkOut: { $lt: now },
          bookingStatus: { $nin: ["completed", "cancelled"] },
        },
        {
          $set: {
            bookingStatus: "completed",
            updatedAt: new Date(),
          },
          $push: {
            statusHistory: {
              status: "completed",
              changedAt: new Date(),
              note: "Auto-completed by cron",
            },
          },
        }
      );

      console.log("✅ Auto completed:", result.modifiedCount);
    } catch (err) {
      console.error("❌ Cron error:", err.message);
    }
  },
  { timezone: "Asia/Kolkata" }
);
