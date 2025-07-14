import express from "express";
import { isAuthorized } from "../middlewares/authMiddleware.js";
import {
    cancelBookingPropertyDate,
    checkBookingConflict,
    editBookingPropertyDate,
    getBookingProperty,
    postBookingProperty,
    getPastandCancelledBooking,
    getActiveBooking,
    getHostBookingHistory,
    deleteGuestHistroyBooking,
} from "../controllers/bookingController.js";


const router = express.Router();

router.get("/my-bookings", isAuthorized, getBookingProperty);
router.post("/property/:propertyId", isAuthorized, postBookingProperty);
router.put("/bookings/:bookingId/edit", isAuthorized, editBookingPropertyDate);
router.delete("/bookings/:bookingId/delete", isAuthorized, cancelBookingPropertyDate);



// ✅ Add conflict check route
router.get("/bookings/:propertyId/conflict-check", isAuthorized, checkBookingConflict);
router.get("/past-or-cancelled", isAuthorized, getPastandCancelledBooking);
router.delete("/guest/delete-history/:bookingId", isAuthorized, deleteGuestHistroyBooking);


//Host page route Active and upcomming 
router.get("/host/active-bookings", isAuthorized, getActiveBooking);
router.get("/host/history-bookings", isAuthorized, getHostBookingHistory);



export default router;


