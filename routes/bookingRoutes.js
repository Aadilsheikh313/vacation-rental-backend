// routes/bookingRoutes.js
import express from "express";
import { isAuthorized } from "../middlewares/authMiddleware.js";
import {
  cancelBookingPropertyDate,
  checkBookingConflict,
  editBookingPropertyDate,
  getBookingProperty,
  postBookingProperty,
  getActiveBooking,
  getHostBookingHistory,
  deleteGuestHistroyBooking,
  createTempBooking,
  handleCashBookingRequest,
} from "../controllers/bookingController.js";

const router = express.Router();

router.get("/my-bookings", isAuthorized, getBookingProperty);

// TEMP BOOKING (before payment)
router.post("/create-temp", isAuthorized, createTempBooking);

// CASH BOOKING (direct booking)
router.post("/property/:propertyId", isAuthorized, postBookingProperty);

router.put("/bookings/:bookingId/edit", isAuthorized, editBookingPropertyDate);
router.delete("/bookings/:bookingId/delete", isAuthorized, cancelBookingPropertyDate);

router.get("/bookings/:propertyId/conflict-check", checkBookingConflict);
router.delete("/guest/delete-history/:bookingId", isAuthorized, deleteGuestHistroyBooking);

// Host routes
router.get("/host/active-bookings", isAuthorized, getActiveBooking);
router.post("/host/booking/aceptandcancel", isAuthorized, handleCashBookingRequest)
router.get("/host/history-bookings", isAuthorized, getHostBookingHistory);

export default router;