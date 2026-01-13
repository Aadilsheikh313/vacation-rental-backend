process.env.TZ = "UTC";

if (process.env.NODE_ENV !== "production") {
  console.log("Razorpay Key Loaded");
}


import app from "./app.js";
import cloudinary from "cloudinary";
import "./cron/bookingStatusUpdater.js";



cloudinary.v2.config({
    cloud_name: process.env.CLOUDINARY_CLIENT_NAME,
    api_key: process.env.CLOUDINARY_CLIENT_APIKEY,
    api_secret: process.env.CLOUDINARY_CLIENT_APISECRET
})

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
