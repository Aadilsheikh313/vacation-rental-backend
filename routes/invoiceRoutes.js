import express from "express";
import { isAuthorized } from "../middlewares/authMiddleware.js";
import {
  downloadBookingInvoice,
  getInvoiceDetails,
} from "../controllers/invoiceController.js";

const router = express.Router();

router.get("/view/:bookingId", isAuthorized, getInvoiceDetails);
router.get("/download/:bookingId", isAuthorized, downloadBookingInvoice);

export default router;