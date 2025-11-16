import Razorpay from 'razorpay';
import crypto from 'crypto';
import axios from 'axios';
import { Booking } from '../models/Booking.js';
import { Payment } from '../models/Payment.js';
import ErrorHandler from '../middlewares/errorMiddleware.js';
import { catchAsyncError } from '../middlewares/catchAsyncError.js';

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

  const booking = await Booking.findById(bookingId).populate('property');
  if (!booking) return next(new ErrorHandler('Booking not found', 404));

  const amountRupees = booking.totalAmount;
  if (amountRupees <= 0) return next(new ErrorHandler('Invalid amount', 400));

  const options = {
    amount: toPaisa(amountRupees),
    currency: 'INR',
    receipt: bookingId.toString(),
    payment_capture: 1, // auto capture
    notes: {
      bookingId: bookingId.toString(),
      propertyId: booking.property?._id?.toString() || '',
      userId: req.user?._id?.toString() || '',
    },
  };

  const order = await razorpay.orders.create(options);
  // return the order to frontend to open checkout
  res.status(200).json({
     success: true, 
     order
     });
});

export const getKey = async (req, res) => {
    res.status(200).json({
        key: key_id,
    })
};
// VERIFY PAYMENT (handler called by frontend after successful checkout)
export const verifyPayment = catchAsyncError(async (req, res, next) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    bookingId,
    // optionally: paymentMethod etc.
  } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !bookingId) {
    return next(new ErrorHandler('Missing payment verification parameters', 400));
  }

  // verify signature (order_id|payment_id HMAC-SHA256 using secret)
  const generated_signature = crypto
    .createHmac('sha256', process.env.RAZORPAY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  if (generated_signature !== razorpay_signature) {
    return next(new ErrorHandler('Payment signature verification failed', 400));
  }

  // fetch booking + property
  const booking = await Booking.findById(bookingId).populate('property');
  if (!booking) return next(new ErrorHandler('Booking not found', 404));

  // compute fees (configurable)
  const PLATFORM_FEE_PERCENT = Number(process.env.PLATFORM_FEE_PERCENT || 2);
  const platformFee = +(booking.property.price * (PLATFORM_FEE_PERCENT / 100)).toFixed(2); // rupees
  const hostAmountRupees = +(booking.totalAmount - platformFee).toFixed(2);

  // create payment record
  const paymentDoc = await Payment.create({
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    bookingId,
    userId: req.user._id,
    hostId: booking.property.userId,
    hostRazorpayAccount: booking.property.hostRazorpayAccount, // ensure stored on property
    amount: booking.totalAmount,
    paymentMethod: booking.paymentMethod || 'online',
    platformFee,
    payoutStatus: 'pending',
    status: 'success',
  });

  // update booking statuses
  booking.paymentStatus = 'paid';
  booking.bookingStatus = 'confirmed';
  await booking.save();

  // If there's no host connected account, leave payout pending and return
  const hostAccountId = booking.property.hostRazorpayAccount;
  if (!hostAccountId) {
    // Admin / manual onboarding required for host account
    return res.status(200).json({
      success: true,
      message: 'Payment verified, but host has no connected account. Manual payout required.',
      payment: paymentDoc,
    });
  }

  // Create transfer to host using Route / Transfers API.
  // Approach A: Use Razorpay Node SDK (if supported)
  try {
    // prepare transfers array (amount in paisa)
    const transfersBody = {
      transfers: [
        {
          account: hostAccountId, // linked account id, e.g. acc_xxx
          amount: toPaisa(hostAmountRupees),
          currency: 'INR',
          notes: {
            bookingId: bookingId.toString(),
            platformFee: platformFee.toString(),
          },
        },
      ],
    };

    // Some SDK versions expose razorpay.payments.transfer/payment.transfer. If not, fallback to direct REST call (below).
    let transferResponse;
    if (typeof razorpay.payments.transfer === 'function') {
      // Many older examples call razorpay.payments.transfer(paymentId, body)
      transferResponse = await razorpay.payments.transfer(razorpay_payment_id, transfersBody);
    } else {
      // Fallback: raw POST using axios to /v1/payments/:id/transfers
      const url = `https://api.razorpay.com/v1/payments/${razorpay_payment_id}/transfers`;
      transferResponse = (await axios.post(url, transfersBody, {
        auth: { username: process.env.RAZORPAY_KEY_ID, password: process.env.RAZORPAY_SECRET },
        headers: { 'Content-Type': 'application/json' },
      })).data;
    }

    // mark payout success (or pending depending on response)
    paymentDoc.payoutStatus = 'paid';
    paymentDoc.payoutAt = new Date();
    await paymentDoc.save();

    return res.status(200).json({
      success: true,
      message: 'Payment verified and transfer to host initiated',
      payment: paymentDoc,
      transferResponse,
    });
  } catch (err) {
    // mark payout failed but payment success
    paymentDoc.payoutStatus = 'failed';
    await paymentDoc.save();
    console.error('Host payout failed:', err?.response?.data || err.message || err);
    return res.status(200).json({
      success: true,
      message: 'Payment verified but host payout failed. Admin action required.',
      payment: paymentDoc,
      error: err?.response?.data || err?.message,
    });
  }
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
