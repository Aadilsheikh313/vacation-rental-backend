import express from "express";
import { getAllActiveBooking } from "../../controllers/admin/adminDashboardController.js";

const router = express.Router();

router.get("/admin/bookings", getAllActiveBooking);

export default router;