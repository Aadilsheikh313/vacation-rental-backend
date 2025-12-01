// routes/paymentRoutes.js
import express from "express";
import { isAuthorized } from "../middlewares/authMiddleware.js";
import {
  createOrder,
  verifyPayment,
  getKey,
} from "../controllers/paymentController.js";

const router = express.Router();

/**
 * PAYMENT FLOW
 */
router.get("/key", isAuthorized, getKey);               // Get Razorpay Public Key
router.post("/order", isAuthorized, createOrder);       // Create Razorpay Order
router.post("/verify", isAuthorized, verifyPayment);    // Verify Payment + Confirm Booking

export default router;
