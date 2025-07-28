import express from "express";
import { getAdminAllActiveBooking, getAdminAllCancelBooking, getAdminAllPastBooking, getAdminAllUpcomingBooking, getAllAminBooking } from "../../controllers/admin/adminDashboardController.js";

const router = express.Router();

router.get("/admin/bookings", getAllAminBooking);
router.get("/admin/upcomingbookings", getAdminAllUpcomingBooking);
router.get("/admin/activebookings", getAdminAllActiveBooking);
router.get("/admin/cancelbookings",getAdminAllCancelBooking);
router.get("/admin/pastbookings", getAdminAllPastBooking);

export default router;