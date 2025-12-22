// controllers/paymentController.js
import Razorpay from "razorpay";
import crypto from "crypto";
import axios from "axios";
import mongoose from "mongoose";
import { Booking } from "../models/Booking.js";
import { Payment } from "../models/Payment.js";
import ErrorHandler from "../middlewares/errorMiddleware.js";
import { catchAsyncError } from "../middlewares/catchAsyncError.js";


const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET,
});

// Convert rupees to paisa
const toPaisa = (amount) => Math.round(Number(amount) * 100);

/**
 * 🔹 Create Razorpay order for a booking
 */
export const createOrder = catchAsyncError(async (req, res, next) => {
  const { bookingId } = req.body;

  if (!bookingId) return next(new ErrorHandler("bookingId required", 400));

  const booking = await Booking.findById(bookingId).populate("property");
  if (!booking) return next(new ErrorHandler("Booking not found", 404));
  if (booking.paymentStatus === "paid")
    return next(new ErrorHandler("Booking already paid", 400));

  const amount = Number(booking.totalAmount);
  if (!amount || amount <= 0)
    return next(new ErrorHandler("Invalid payable amount", 400));

  const options = {
    amount: toPaisa(amount),
    currency: "INR",
    receipt: `booking_${bookingId}`,
    payment_capture: 1,
    notes: {
      bookingId: bookingId.toString(),
      propertyId: booking.property?._id?.toString() || "",
      userId: req.user?._id?.toString() || "",
    },
  };

  const order = await razorpay.orders.create(options);
  return res.status(200).json({ success: true, order });
});

/**
 * 🔹 Return Razorpay PUBLIC KEY to frontend
 */
export const getKey = (req, res) => {
  res.status(200).json({ key: process.env.RAZORPAY_KEY_ID });
};

/**
 * 🔹 Verify signature → finalize booking → create payment record
 */
export const verifyPayment = catchAsyncError(async (req, res, next) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId } =
    req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !bookingId)
    return next(new ErrorHandler("Payment verification failed", 400));

  // Signature verification
  const generated = crypto
    .createHmac("sha256", process.env.RAZORPAY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (generated !== razorpay_signature)
    return next(new ErrorHandler("Invalid payment signature", 400));

  const session = await mongoose.startSession();
  let paymentDoc, booking;

  try {
    await session.withTransaction(async () => {
      booking = await Booking.findById(bookingId)
        .populate("property")
        .session(session);

      if (!booking) throw new Error("Booking not found");
      if (booking.paymentStatus === "paid") throw new Error("Already paid");

      // Update Booking
      booking.paymentStatus = "paid";
      booking.bookingStatus = "confirmed";
      booking.paymentId = razorpay_payment_id;
      booking.paymentMethod = "razorpay";
      booking.statusHistory.push({
        status: "confirmed",
        changedBy: req.user._id,
        note: "Payment verified successfully",
      });
      await booking.save({ session });

      // Platform fee 2%
      const platformFee = +(booking.totalAmount * 0.02).toFixed(2);

      // Create Payment entry
      paymentDoc = await Payment.create(
        [
          {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            bookingId,
            userId: req.user._id,
            amount: booking.totalAmount,
            platformFee,
            paymentMethod: "razorpay",
            status: "success",
            payoutStatus: booking.property.hostRazorpayAccount ? "pending" : "not_applicable",
          },
        ],
        { session }
      );
      paymentDoc = paymentDoc[0];
    });
  } catch (error) {
    if (session.inTransaction()) await session.abortTransaction();
    return next(new ErrorHandler(error.message || "Payment verification failed", 400));
  } finally {
    await session.endSession();
  }


  /**
   * 🔹 Host payout transfer (executed OUTSIDE transaction)
   */
  if (booking.property.hostRazorpayAccount) {
    try {
      const hostAmount = +(booking.totalAmount - paymentDoc.platformFee).toFixed(2);

      const payoutResponse = await axios.post(
        `https://api.razorpay.com/v1/payments/${razorpay_payment_id}/transfers`,
        {
          transfers: [
            {
              account: booking.property.hostRazorpayAccount,
              amount: toPaisa(hostAmount),
              currency: "INR",
            },
          ],
        },
        {
          auth: {
            username: process.env.RAZORPAY_KEY_ID,
            password: process.env.RAZORPAY_SECRET,
          },
        }
      );

      await Payment.findByIdAndUpdate(paymentDoc._id, {
        payoutStatus: "paid",
        payoutAt: new Date(),
        transactionId: payoutResponse?.id || null,
      });
    } catch (error) {
      await Payment.findByIdAndUpdate(paymentDoc._id, {
        payoutStatus: "failed",
      });
    }
  }

  return res.status(200).json({
    success: true,
    message: "Payment verified successfully",
    booking,
    payment: paymentDoc,
  });
});


export const getPaymentStatus = catchAsyncError(async (req, res, next) => {
  const { bookingId } = req.params;

  const booking = await Booking.findById(bookingId).populate("property");
  if (!booking) return next(new ErrorHandler("Booking not found", 404));

  const payment = await Payment.findOne({ bookingId }).sort({ createdAt: -1 });

  return res.status(200).json({
    success: true,
    booking,
    payment: payment || null, // cash booking case
  });
});


// Edit extra payemt controller function 
export const editExtraPayment = catchAsyncError(async (req, res, next) => {
  const { bookingId } = req.body;

  const booking = await Booking.findById(bookingId).populate("property");
  if (!booking) return next(new ErrorHandler("Booking not found", 404));


  if (!booking.extraPayment || booking.extraPayment <= 0) {
    return next(new ErrorHandler("No extra payment required", 400));
  }

  const options = {
    amount: toPaisa(booking.extraPayment),
    currency: "INR",
    receipt: `edit_booking_${bookingId}`,
    notes: { bookingId }
  }
  const order = await razorpay.orders.create(options);

  return res.status(200).json({
    success: true,
    order,
    amount: booking.extraPayment,
    bookingId
  });
})


// edit extra payment verification controller function
// edit extra payment verify
export const verifyEditExtraPayment = catchAsyncError(async (req, res, next) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !bookingId)
    return next(new ErrorHandler("Payment verification failed", 400));

  const generatedSign = crypto
    .createHmac("sha256", process.env.RAZORPAY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (generatedSign !== razorpay_signature)
    return next(new ErrorHandler("Invalid payment signature", 400));

  const session = await mongoose.startSession();
  let booking, payment;

  try {
    await session.withTransaction(async () => {
      booking = await Booking.findById(bookingId)
        .populate("property")
        .session(session);

      if (!booking) throw new Error("Booking not found");
      if (booking.extraPayment <= 0) throw new Error("No outstanding balance");
      if (booking.paymentStatus === "paid" && booking.extraPayment === 0)
        throw new Error("Already paid");

      const extra = booking.extraPayment;
      const platformFee = +(extra * 0.02).toFixed(2);

      // ✨ FINAL BOOKING PAYMENT UPDATE
      booking.extraPayment = 0;
      booking.refundAmount = 0; // cleanup
      booking.paymentStatus = "paid";
      booking.bookingStatus = "confirmed";
      booking.paymentId = razorpay_payment_id;
      booking.paymentMethod = "razorpay";

      booking.statusHistory.push({
        status: "confirmed",
        changedBy: req.user._id,
        note: `Extra amount ₹${extra} paid successfully`,
      });

      await booking.save({ session });

      // Create Payment entry
      payment = await Payment.create(
        [
          {
            bookingId,
            userId: req.user._id,
            amount: extra,
            platformFee,
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            paymentMethod: "razorpay",
            status: "success",
            payoutStatus: booking.property.hostRazorpayAccount ? "pending" : "not_applicable",
          },
        ],
        { session }
      );

      payment = payment[0];
    });
  } catch (err) {
    if (session.inTransaction()) await session.abortTransaction();
    return next(new ErrorHandler(err.message, 400));
  } finally {
    await session.endSession();
  }

  // 🟢 Pay host after transaction
  if (booking.property.hostRazorpayAccount) {
    try {
      const hostAmount = +(payment.amount - payment.platformFee).toFixed(2);
      const payoutRes = await axios.post(
        `https://api.razorpay.com/v1/payments/${razorpay_payment_id}/transfers`,
        {
          transfers: [
            {
              account: booking.property.hostRazorpayAccount,
              amount: hostAmount * 100,
              currency: "INR",
            },
          ],
        },
        {
          auth: {
            username: process.env.RAZORPAY_KEY_ID,
            password: process.env.RAZORPAY_SECRET,
          },
        }
      );

      await Payment.findByIdAndUpdate(payment._id, {
        payoutStatus: "paid",
        payoutAt: new Date(),
        transactionId: payoutRes?.id || null,
      });
    } catch {
      await Payment.findByIdAndUpdate(payment._id, { payoutStatus: "failed" });
    }
  }

  return res.status(200).json({
    success: true,
    booking,
    payment,
  });
});
