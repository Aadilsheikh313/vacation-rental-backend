import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import { connectDB } from "./config/db.js";

import { errorMiddleware } from "./middlewares/errorMiddleware.js";


import authRoutes from "./routes/authRoutes.js";
import propertyRoutes from "./routes/propertyRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import invoiceRoutes from "./routes/invoiceRoutes.js";

const app = express();
dotenv.config();

app.use(cors({
    origin:[process.env.FRONTEND_URL],
    methods:["GET", "POST", "DELETE", "PUT"],
    credentials:true,
}));

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({extended:true}));



app.use('/api/auth',authRoutes);
app.use('/api/property',propertyRoutes);
app.use('/api/review', reviewRoutes);
app.use('/api/booking', bookingRoutes);
app.use('/api/invoice', invoiceRoutes); 
app.use('/api/payment',paymentRoutes);

connectDB();

app.use(errorMiddleware);

export  default app;

