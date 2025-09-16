import express from "express";
import { isAuthorized } from '../middlewares/authMiddleware.js';
import { GuestPastBooking } from '../controllers/GuestDashController.js';


const router = express.Router();

router.get("/pastbooking", isAuthorized, GuestPastBooking);

export default router;


