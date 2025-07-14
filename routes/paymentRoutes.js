import express from 'express';
import {  isAuthorized } from '../middlewares/authMiddleware.js';
import { createOrder, verifyPayment } from '../controllers/paymentController.js';

const router = express.Router();

router.post('/create-order', isAuthorized, createOrder);
router.post('/verify', isAuthorized, verifyPayment);

export default router;
