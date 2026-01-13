import express from "express";
import dotenv from "dotenv";
dotenv.config();  
import cors from "cors";
import cookieParser from "cookie-parser";
import { connectDB } from "./config/db.js";

import tripRoutes from './routes/tripRoutes.js';
import overpassRoutes from "./routes/overpassRoutes.js";

import { errorMiddleware } from "./middlewares/errorMiddleware.js";
import { updateActivity } from './middlewares/updateLastActive.js';


import authRoutes from "./routes/authRoutes.js";
import propertyRoutes from "./routes/propertyRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import invoiceRoutes from "./routes/invoiceRoutes.js";
import geocodeRouter from "./routes/geocode.js";
import globalSearchRoutes from "./routes/globalSearchRoutes.js";

//==================== Admin Routes start =================
import adminRoutes from "./routes/adminroutes/adimauthRoutes.js";
import adminHomeDashRoutes from "./routes/adminroutes/adminHomeDashRoutes.js";
import adminDashboardRoutes from "./routes/adminroutes/adminDashboardRoutes.js";
import adminHostRoutes from "./routes/adminroutes/adminHostRoutes.js";
import adminGuestRoutes from "./routes/adminroutes/adminGuestRoutes.js";
import adminBannedRoutes from "./routes/adminroutes/adminBannedUserRoutes.js";
import admihVerifyRoutes from "./routes/adminroutes/HostVerificationRoutes.js";
import adminPropertyRoutes from "./routes/adminroutes/activePropertyRoutes.js";
import adminPostRoutes from "./routes/adminroutes/adminPostExperienceRoutes.js";

//==================== Admin Routes end =================
import amenityRoutes from "./routes/amenityRoutes.js";
import policyRoutes from './routes/policyRoutes.js';
import filterRoutes from './routes/filterRoutes.js';
import paginationRoutes from './routes/paginationRouter.js';
import guestRoutes from './routes/GuestDashRoutes.js';
import userRoutes from './routes/userRouter.js';


const app = express();

// ✅ Allowed origins cleanup
const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(",").map(o => o.trim().replace(/\/$/, ""))
  : ["http://localhost:5173"];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin?.replace(/\/$/, ""))) {
      callback(null, true);
    } else {
      console.error("❌ CORS blocked:", origin);
      callback(null, false); // <-- don’t crash, just reject
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
}));


// ✅ Parsers
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Custom middleware BEFORE routes
app.use(updateActivity);

// ✅ Routes
app.use('/api/mytrip', tripRoutes);
app.use("/api/overpass", overpassRoutes);

app.use('/api/auth', authRoutes);
app.use('/api/property', propertyRoutes);
app.use('/api/review', reviewRoutes);
app.use('/api/booking', bookingRoutes);
app.use('/api/invoice', invoiceRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api', geocodeRouter);
app.use("/api/search", globalSearchRoutes);
//==================== Admin Routes start =================
app.use('/api/v1', adminRoutes);
app.use('/api/v1', adminHomeDashRoutes);
app.use('/api/v1', adminDashboardRoutes);
app.use('/api/v1', adminHostRoutes);
app.use('/api/v1', adminGuestRoutes);
app.use('/api/host-verify', admihVerifyRoutes);
app.use('/api/banned', adminBannedRoutes);
app.use("/api/active/inactive", adminPropertyRoutes);
app.use("/api/adminpost", adminPostRoutes);
//==================== Admin Routes end =================
app.use("/api/amenities", amenityRoutes);
app.use("/api/polices", policyRoutes);
app.use("/api/filter", filterRoutes);
app.use('/api/page', paginationRoutes);
app.use('/api/guestDash', guestRoutes);
app.use('/api/userProfile', userRoutes);


// ✅ Test route
app.get("/api/v1/test", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Backend is working ✅"
  });
});

// ✅ Connect DB
connectDB();

// ✅ Error middleware ALWAYS last
app.use(errorMiddleware);

export default app;

