import Razorpay from 'razorpay';
import crypto from 'crypto';
import axios from 'axios';
import { Booking } from '../models/Booking.js';
import { Payment } from '../models/Payment.js';
import ErrorHandler from '../middlewares/errorMiddleware.js';
import { catchAsyncError } from '../middlewares/catchAsyncError.js';
import { log } from 'console';

// init razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET,
});

// helper to convert rupees to paisa (integer)
const toPaisa = (amountInRupees) => Math.round(amountInRupees * 100);

// CREATE ORDER
export const createOrder = catchAsyncError(async (req, res, next) => {
  const { bookingId } = req.body;
  if (!bookingId) return next(new ErrorHandler('bookingId required', 400));

  // find booking and ensure pending
  const booking = await Booking.findById(bookingId).populate("property");
  if (!booking) return next(new ErrorHandler('Booking not found', 404));
  if (booking.paymentStatus === "paid") return next(new ErrorHandler('Booking already paid', 400));

  const amountRupees = Number(booking.totalAmount);
  if (amountRupees <= 0) return next(new ErrorHandler('Invalid amount', 400));

  const options = {
    amount: toPaisa(amountRupees),
    currency: 'INR',
    receipt: bookingId.toString(),       // receipt = bookingId helps mapping
    payment_capture: 1,
    notes: {
      bookingId: bookingId.toString(),
      propertyId: booking.property?._id?.toString() || '',
      userId: req.user?._id?.toString() || '',
    },
  };

  const order = await razorpay.orders.create(options);
  // return the order to frontend
  res.status(200).json({
    success: true,
    order,               // order.id, order.amount, etc
  });
});


export const getKey = async (req, res) => {
  res.status(200).json({
    key: process.env.RAZORPAY_KEY_ID,
  })
};


export const verifyPayment = catchAsyncError(async (req, res, next) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId } = req.body;
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !bookingId)
    return next(new ErrorHandler('All payment params & bookingId are required', 400));

  const generated_signature = crypto
    .createHmac('sha256', process.env.RAZORPAY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  if (generated_signature !== razorpay_signature)
    return next(new ErrorHandler('Invalid payment signature', 400));

  const booking = await Booking.findById(bookingId).populate('property');
  if (!booking) return next(new ErrorHandler('Booking not found', 404));

  // update booking
  booking.paymentStatus = "paid";
  booking.bookingStatus = "confirmed";
  booking.paymentId = razorpay_payment_id;
  booking.statusHistory.push({ status: "confirmed", changedBy: req.user._id, note: "Payment verified" });
  await booking.save();

  const platformFee = +(booking.totalAmount * (Number(process.env.PLATFORM_FEE_PERCENT || 2) / 100)).toFixed(2);
  const hostAmount = +(booking.totalAmount - platformFee).toFixed(2);

  const paymentDoc = await Payment.create({
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    bookingId: booking._id,
    userId: req.user._id,
    hostId: booking.property.userId,
    hostRazorpayAccount: booking.property.hostRazorpayAccount || null,
    amount: booking.totalAmount,
    paymentMethod: booking.paymentMethod || "Razorpay",
    platformFee,
    payoutStatus: booking.property.hostRazorpayAccount ? "pending" : "failed",
    status: "success",
  });

  // If host account exists, attempt transfer (best-effort)
  if (booking.property.hostRazorpayAccount) {
    try {
      const transfersBody = {
        transfers: [
          {
            account: booking.property.hostRazorpayAccount,
            amount: toPaisa(hostAmount),
            currency: 'INR',
            notes: { bookingId: booking._id.toString(), platformFee: platformFee.toString() },
          },
        ],
      };

      const transferResponse = (await axios.post(
        `https://api.razorpay.com/v1/payments/${razorpay_payment_id}/transfers`,
        transfersBody,
        { auth: { username: process.env.RAZORPAY_KEY_ID, password: process.env.RAZORPAY_SECRET } }
      )).data;

      paymentDoc.payoutStatus = 'paid';
      paymentDoc.payoutAt = new Date();
      await paymentDoc.save();

      return res.status(200).json({
        success: true,
        message: 'Payment verified & host transfer initiated',
        booking,
        payment: paymentDoc,
        transferResponse,
      });
    } catch (err) {
      paymentDoc.payoutStatus = 'failed';
      await paymentDoc.save();
      return res.status(200).json({
        success: true,
        message: 'Payment verified but payout failed (admin action required)',
        booking,
        payment: paymentDoc,
        error: err?.response?.data || err?.message,
      });
    }
  }

  // if host account not configured:
  return res.status(200).json({
    success: true,
    message: 'Payment verified. Host payout pending (no connected account).',
    booking,
    payment: paymentDoc,
  });
});

// WEBHOOK (recommended) - receives various events from Razorpay and verifies signature
export const razorpayWebhook = catchAsyncError(async (req, res, next) => {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret) return next(new ErrorHandler('Webhook secret not configured', 500));

  const signature = req.headers['x-razorpay-signature'];
  const payload = JSON.stringify(req.body);

  const expected = crypto.createHmac('sha256', webhookSecret).update(payload).digest('hex');
  if (expected !== signature) {
    return res.status(400).json({ success: false, message: 'Invalid webhook signature' });
  }

  const event = req.body.event;
  // Example: handle payment.captured
  if (event === 'payment.captured') {
    const paymentEntity = req.body.payload.payment.entity;
    const razorpay_payment_id = paymentEntity.id;
    const razorpay_order_id = paymentEntity.order_id;
    const amount = paymentEntity.amount / 100; // rupees

    // You can find the booking from order receipt or notes
    const receipt = paymentEntity?.notes?.bookingId || paymentEntity?.receipt;
    const bookingId = receipt;

    // Optionally trigger transfer logic here, or mark payment captured and let verifyPayment endpoint handle transfers
    console.log('Webhook captured payment:', razorpay_payment_id, 'order:', razorpay_order_id, 'booking:', bookingId);
    // (Implement any background job to create transfer / notify admin)
  }

  // Always acknowledge quickly
  res.status(200).json({ success: true });
});
