process.env.TZ = "UTC";
// import dotenv from "dotenv";
// dotenv.config();


console.log("ENV CHECK:", {
    KEY: process.env.RAZORPAY_KEY_ID,
    SECRET: process.env.RAZORPAY_SECRET,
});

import app from "./app.js";
import cloudinary from "cloudinary";
import "./cron/bookingStatusUpdater.js";


console.log("Razorpay Keys R:", process.env.RAZORPAY_KEY_ID, process.env.RAZORPAY_SECRET);  



cloudinary.v2.config({
    cloud_name: process.env.CLOUDINARY_CLIENT_NAME,
    api_key: process.env.CLOUDINARY_CLIENT_APIKEY,
    api_secret: process.env.CLOUDINARY_CLIENT_APISECRET
})

app.listen(process.env.PORT, () => {
    console.log(`The server was running on port ${process.env.PORT}`);
})