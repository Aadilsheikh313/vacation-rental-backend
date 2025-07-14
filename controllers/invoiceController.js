import { generateInvoiceBuffer } from "../utils/generateInvoice.js";
import { catchAsyncError } from "../middlewares/catchAsyncError.js";
import { Booking } from "../models/Booking.js";
import { Invoice } from "../models/invoiceModel.js";
import ErrorHandler from "../middlewares/errorMiddleware.js";
import cloudinary from "../config/cloudinary.js";
import streamifier from "streamifier";

const generateInvoiceNumber = () => {
  return `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
};

const streamUpload = (buffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "invoices", resource_type: "raw" },
      (error, result) => {
        if (result) resolve(result);
        else reject(error);
      }
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });
};

export const downloadBookingInvoice = catchAsyncError(async (req, res, next) => {
  const bookingId = req.params.bookingId;

  const booking = await Booking.findById(bookingId)
    .populate("user", "name email")
    .populate({
      path: "property",
      populate: {
        path: "userId",
        select: "name email phone",
      },
    });
 
  if (!booking) return next(new ErrorHandler("Booking not found", 404));

  if (booking.user._id.toString() !== req.user._id.toString()) {
    return next(new ErrorHandler("You are not authorized to download this invoice", 403));
  }

  const pdfBuffer = await generateInvoiceBuffer(booking);
  const result = await streamUpload(pdfBuffer);
  console.log("Cloudinary upload result", result);

  const invoice = new Invoice({
    booking: booking._id,
    user: booking.user._id,
    property: booking.property._id,
    invoiceUrl: result.secure_url,
    invoicePublicId: result.public_id,
    invoiceNumber: generateInvoiceNumber(),
  });
  await invoice.save();

  res.set({
    "Content-Type": "application/pdf",
    "Content-Disposition": `attachment; filename=Invoice-${bookingId}.pdf`,
  });

  res.send(pdfBuffer);
});

export const getInvoiceDetails = catchAsyncError(async (req, res, next) => {
  const invoice = await Invoice.findOne({ booking: req.params.bookingId })
    .populate("booking")
    .populate("user", "name email")
    .populate("property", "title");

  if (!invoice) return next(new ErrorHandler("Invoice not found", 404));

  res.status(200).json({
    success: true,
    invoice,
  });
});