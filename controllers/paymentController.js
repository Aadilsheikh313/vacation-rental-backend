import Razorpay from 'razorpay';
import crypto from 'crypto';
import { Payment } from '../models/Payment.js';
import { Booking } from '../models/Booking.js';
import { Property } from '../models/Property.js';
import ErrorHandler from '../middlewares/errorMiddleware.js';
import { catchAsyncError } from '../middlewares/catchAsyncError.js';

// Razorpay instance
const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET,
});

// Create Order
export const createOrder = catchAsyncError(async (req, res, next) => {
  const { bookingId } = req.body;
  const booking = await Booking.findById(bookingId).populate('property');
  if (!booking) return next(new ErrorHandler("Booking not found", 404));

  const amount = booking.totalAmount; // total amount guest pays (INR)
  const options = {
    amount: amount * 100, // paisa
    currency: 'INR',
    receipt: bookingId.toString(),
    payment_capture: 1, // auto capture
  };

  const order = await razorpayInstance.orders.create(options);
  res.status(200).json({ success: true, order });
});

// Verify Payment & Trigger Host Payout
export const verifyPayment = catchAsyncError(async (req, res, next) => {
  const { bookingId } = req.body;
  const booking = await Booking.findById(bookingId).populate('property');
  if (!booking) return next(new ErrorHandler("Booking not found", 404));

  // ✅ Handle cash payment first
  if (booking.paymentMethod === "cash") {
    const payment = await Payment.create({
      bookingId,
      userId: req.user._id,
      hostId: booking.property.userId,
      amount: booking.totalAmount,
      paymentMethod: "cash",
      status: "pending",   // ya "success" agar immediate confirmation allowed
      payoutStatus: "pending", // host payout manual
      platformFee: 0,
    });

    booking.paymentStatus = "pending"; // cash collected par update
    booking.bookingStatus = "confirmed"; // ya "pending" until cash collected
    await booking.save();

    return res.status(200).json({
      success: true,
      message: "Cash payment selected. Confirm manually on arrival.",
      payment,
    });
  }

  // 🔹 For online payment (Razorpay)
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return next(new ErrorHandler("Payment details missing", 400));
  }

  // Verify Razorpay signature
  const sign = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_SECRET)
    .update(sign)
    .digest('hex');

  if (expectedSignature !== razorpay_signature) {
    return next(new ErrorHandler("Payment verification failed", 400));
  }

  // ✅ Calculate platform fee & host payout
  const platformFee = booking.property.price * 0.02; // 2% of base property price
  const hostAmount = booking.totalAmount - platformFee;

  // Create Payment doc
  const payment = await Payment.create({
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    bookingId,
    userId: req.user._id,
    hostId: booking.property.userId,
    amount: booking.totalAmount,
    paymentMethod: booking.paymentMethod,
    platformFee,
    payoutStatus: "pending",
    status: "success",
  });

  // Update Booking
  booking.paymentStatus = 'paid';
  booking.bookingStatus = 'confirmed';
  await booking.save();

  // 💰 Trigger host payout (via Razorpay Transfer API)
  try {
    await razorpayInstance.payments.transfer(razorpay_payment_id, {
      account: booking.property.hostRazorpayAccount, // host ke connected account
      amount: hostAmount * 100, // paisa
      currency: 'INR',
      notes: {
        bookingId: bookingId.toString(),
        platformFee: platformFee.toString(),
      },
    });

    payment.payoutStatus = "paid";
    payment.payoutAt = new Date();
    await payment.save();
  } catch (error) {
    payment.payoutStatus = "failed";
    await payment.save();
    console.error("Host payout failed:", error);
  }

  res.status(200).json({ success: true, message: "Payment verified and payout triggered", payment });
});
