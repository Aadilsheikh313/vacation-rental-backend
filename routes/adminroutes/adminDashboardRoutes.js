import express from "express";
import {
    getAdminAllActiveBooking,
    getAdminAllCancelBooking,
    getAdminAllPastBooking,
    getAdminAllUpcomingBooking,
    getAllAminBooking,
    getTotalAmount,
    getTotalBooking
} from "../../controllers/admin/adminDashboardController.js";

const router = express.Router();

router.get("/admin/bookings", getAllAminBooking);
router.get("/admin/upcomingbookings", getAdminAllUpcomingBooking);
router.get("/admin/activebookings", getAdminAllActiveBooking);
router.get("/admin/cancelbookings", getAdminAllCancelBooking);
router.get("/admin/pastbookings", getAdminAllPastBooking);
router.get("/admin/total-amount", getTotalAmount);
router.get("/admin/total-bookings", getTotalBooking);

export default router;