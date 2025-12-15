import {
  generateInvoiceBuffer,
  generateInvoiceNumber,
} from "../utils/generateInvoice.js";

import { catchAsyncError } from "../middlewares/catchAsyncError.js";
import { Booking } from "../models/Booking.js";
import { Invoice } from "../models/invoiceModel.js";
import ErrorHandler from "../middlewares/errorMiddleware.js";
import cloudinary from "../config/cloudinary.js";
import streamifier from "streamifier";

// Cloudinary upload stream
const streamUpload = (buffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "invoices", resource_type: "auto" },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });
};

// ================================
// VIEW INVOICE DETAILS (AUTO-GENERATE IF NOT FOUND)
// ================================
export const getInvoiceDetails = catchAsyncError(async (req, res, next) => {
  const bookingId = req.params.bookingId;

  // Try to find existing invoice
  let invoice = await Invoice.findOne({ booking: bookingId })
    .populate({
      path: "booking",
      populate: [
        { path: "property", select: "title city price userId" },
        { path: "user", select: "name email phone" }
      ]
    })
    .populate("property", "title city price userId ")
    .populate("user", "name email")
    .populate("propertyOwner", "name email phone");

  // 🔥 IF INVOICE EXISTS → RETURN IT
  if (invoice) {
    return res.status(200).json({
      success: true,
      invoice,
    });
  }

  // ---------------------------------------------------
  // 🔥 IF NOT FOUND → GENERATE NEW INVOICE NOW
  // ---------------------------------------------------
  const booking = await Booking.findById(bookingId)
    .populate("user", "name email")
    .populate({
      path: "property",
      populate: { path: "userId", select: "name email phone" },
    });

  if (!booking) {
    return next(new ErrorHandler("Booking not found", 404));
  }

  // Generate fresh PDF
  const pdfBuffer = await generateInvoiceBuffer(booking);

  // Upload to Cloudinary
  const uploadResult = await streamUpload(pdfBuffer);

  // Create invoice entry in DB
  invoice = await Invoice.create({
    booking: booking._id,
    user: booking.user._id,
    propertyOwner: booking.property.userId,
    property: booking.property._id,
    invoiceUrl: uploadResult.secure_url,
    invoicePublicId: uploadResult.public_id,
    invoiceNumber: generateInvoiceNumber(),
  });

  // ✅ POPULATE AFTER CREATE
  invoice = await Invoice.findById(invoice._id)
    .populate("propertyOwner", "name email phone")
    .populate("user", "name email phone")
    .populate("property", "title city price")
    .populate({
      path: "booking",
      populate: [
        { path: "user", select: "name email phone" },
        { path: "property", select: "title city price userId" },
      ],
    });
  // Return generated invoice
  return res.status(200).json({
    success: true,
    invoice,
  });
});


// ================================
// DOWNLOAD INVOICE (EXISTING OR NEW)
// ================================
export const downloadBookingInvoice = catchAsyncError(async (req, res, next) => {
  const bookingId = req.params.bookingId;

  const booking = await Booking.findById(bookingId)
    .populate("user", "name email")
    .populate({
      path: "property",
      populate: { path: "userId", select: "name email phone" },
    });

  if (!booking) return next(new ErrorHandler("Booking not found", 404));

  if (booking.user._id.toString() !== req.user._id.toString()) {
    return next(new ErrorHandler("Unauthorized access", 403));
  }

  // Check existing invoice
  let invoice = await Invoice.findOne({ booking: booking._id });

  if (invoice) {
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=${invoice.invoiceNumber}.pdf`,
    });

    const existingPdf = await fetch(invoice.invoiceUrl).then(r => r.arrayBuffer());
    return res.send(Buffer.from(existingPdf));
  }

  // Generate new invoice
  const pdfBuffer = await generateInvoiceBuffer(booking);
  const uploadResult = await streamUpload(pdfBuffer);

  invoice = await Invoice.create({
    booking: booking._id,
    user: booking.user._id,
    property: booking.property._id,
    propertyOwner: booking.property.userId,
    invoiceUrl: uploadResult.secure_url,
    invoicePublicId: uploadResult.public_id,
    invoiceNumber: generateInvoiceNumber(),
  });

  res.set({
    "Content-Type": "application/pdf",
    "Content-Disposition": `attachment; filename=${invoice.invoiceNumber}.pdf`,
  });

  return res.send(pdfBuffer);
});
