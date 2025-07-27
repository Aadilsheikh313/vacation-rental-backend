import express from "express";
import { getAdminAllActiveBooking, getAdminAllCancelBooking, getAllAminBooking } from "../../controllers/admin/adminDashboardController.js";

const router = express.Router();

router.get("/admin/bookings", getAllAminBooking);
router.get("/admin/activebookings", getAdminAllActiveBooking);
router.get("/admin/cancelbookings",getAdminAllCancelBooking);

export default router;