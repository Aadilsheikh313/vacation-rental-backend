import express from "express";
import { isAuthorized } from "../middlewares/authMiddleware.js";
import { downloadBookingInvoice, getInvoiceDetails } from "../controllers/invoiceController.js";



const router = express.Router();

// ✅ Route to view invoice: /api/invoice/view/:bookingId
router.get("/view/:bookingId", isAuthorized, getInvoiceDetails);

// ✅ Route to download invoice: /api/invoice/download/:bookingId
router.get("/download/:bookingId", isAuthorized, downloadBookingInvoice);


export default router;


