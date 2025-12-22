import express from "express";
import { isAuthorized } from '../middlewares/authMiddleware.js';
import {
    GuestConcelBooking,
    GuestCurrentBookings,
    GuestPastBooking,
    GuestUpcommingBookings
} from '../controllers/GuestDashController.js';


const router = express.Router();

router.get("/pastbooking", isAuthorized, GuestPastBooking);
router.get("/currentbooking", isAuthorized, GuestCurrentBookings);
router.get("/upcommingbooking", isAuthorized, GuestUpcommingBookings);
router.get("/cancelbooking", isAuthorized, GuestConcelBooking);


export default router;


