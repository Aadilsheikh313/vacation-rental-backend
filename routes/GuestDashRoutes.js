import express from "express";
import { isAuthorized } from '../middlewares/authMiddleware.js';
import {
    GuestCurrentBookings,
    GuestPastBooking
} from '../controllers/GuestDashController.js';


const router = express.Router();

router.get("/pastbooking", isAuthorized, GuestPastBooking);
router.get("/currentbooking", isAuthorized, GuestCurrentBookings);

export default router;


