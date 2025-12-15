import PDFDocument from "pdfkit";
import { customAlphabet } from "nanoid";

const nanoid = customAlphabet("1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ", 8);

export const generateInvoiceNumber = () => {
  return `INV-${Date.now()}-${nanoid()}`;
};

export const generateInvoiceBuffer = (booking) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const buffers = [];

    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", () => {
      const pdfBuffer = Buffer.concat(buffers);
      resolve(pdfBuffer);
    });

    doc.fontSize(20).text(" Booking Invoice", { align: "center" });
    doc.moveDown().fontSize(14).text(`Invoice Details`, { underline: true });

    doc.moveDown(0.5);
    doc.fontSize(12).text(`Invoice ID: ${booking._id}`);
    doc.text(`Guest Name: ${booking?.user?.name}`);
    doc.text(`Email: ${booking?.user?.email}`);
    doc.text(`Property: ${booking?.property?.title}`);
    doc.text(`Check-in: ${new Date(booking?.checkIn).toDateString()}`);
    doc.text(`Check-out: ${new Date(booking?.checkOut).toDateString()}`);
    doc.text(`Guests: Adults: ${booking?.guests?.adults}, Children: ${booking?.guests?.children}`);
    doc.text(`Total Amount: \u20b9${booking?.totalAmount}`);

    doc.moveDown();
    doc.fontSize(14).text(" Property Owner Contact", { underline: true });
    doc.text(`Owner Name: ${booking?.property?.userId?.name || "N/A"}`);
    doc.text(`Owner Email: ${booking?.property?.userId?.email || "N/A"}`);
    doc.text(`Owner Phone: ${booking?.property?.userId?.phone || "N/A"}`);


    doc.moveDown();
    doc.fontSize(12).text("Thank you for booking with us!");

    doc.end();
  });
};

