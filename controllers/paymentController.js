import Razorpay from 'razorpay';
import crypto from 'crypto';
import { Payment } from '../models/Payment.js';
import { Booking } from '../models/Booking.js';
import ErrorHandler from '../middlewares/errorMiddleware.js';
import { catchAsyncError } from '../middlewares/catchAsyncError.js';

export const createOrder = catchAsyncError(async (req, res, next) => {
  // ✅ Razorpay instance banega yahin, after dotenv load
  const instance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_SECRET,
  });

  console.log("RAZORPAY_KEY_ID:", process.env.RAZORPAY_KEY_ID);
  console.log("RAZORPAY_SECRET:", process.env.RAZORPAY_SECRET);

  const { amount } = req.body;

  const options = {
    amount: amount * 100, // paisa
    currency: 'INR',
  };

  const order = await instance.orders.create(options);

  res.status(200).json({
    success: true,
    order,
  });
});

export const verifyPayment = catchAsyncError(async (req, res, next) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    bookingId,
    amount,
  } = req.body;

  const sign = razorpay_order_id + '|' + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_SECRET)
    .update(sign)
    .digest('hex');

  if (expectedSignature !== razorpay_signature) {
    return next(new ErrorHandler('Payment verification failed', 400));
  }

  await Payment.create({
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    bookingId,
    amount,
    userId: req.user._id,
    status: 'success',
  });

  await Booking.findByIdAndUpdate(bookingId, {
    paymentStatus: 'paid',
    bookingStatus: 'confirmed',
  });

  res.status(200).json({
    success: true,
    message: 'Payment verified successfully',
  });
});
