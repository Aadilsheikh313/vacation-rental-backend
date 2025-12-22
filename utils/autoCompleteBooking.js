import { Booking } from "../models/Booking.js";

export const autoCompleteIfExpired = async (booking) => {
  if (
    booking.bookingStatus !== "completed" &&
    booking.bookingStatus !== "cancelled" &&
    booking.checkOut < new Date()
  ) {
    booking.bookingStatus = "completed";

    booking.statusHistory.push({
      status: "completed",
      changedAt: new Date(),
      note: "Auto-completed on access",
    });

    await booking.save();
  }

  return booking;
};
