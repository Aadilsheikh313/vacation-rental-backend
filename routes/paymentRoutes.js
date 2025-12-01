// routes/paymentRoutes.js
import express from "express";
import { isAuthorized } from "../middlewares/authMiddleware.js";
import {
  createOrder,
  verifyPayment,
  getKey,
  getPaymentStatus,
} from "../controllers/paymentController.js";

const router = express.Router();

/**
 * PAYMENT FLOW
 */
router.get("/key", isAuthorized, getKey);               // Get Razorpay Public Key
router.post("/order", isAuthorized, createOrder);       // Create Razorpay Order
router.post("/verify", isAuthorized, verifyPayment);    // Verify Payment + Confirm Booking

router.get("/status/:bookingId", isAuthorized, getPaymentStatus);

export default router;
