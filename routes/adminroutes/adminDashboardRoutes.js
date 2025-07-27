import express from "express";
import { getAdminAllActiveBooking, getAllAminBooking } from "../../controllers/admin/adminDashboardController.js";

const router = express.Router();

router.get("/admin/bookings", getAllAminBooking);
router.get("/admin/activebookings", getAdminAllActiveBooking);

export default router;