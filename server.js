process.env.TZ = "UTC";
import app from "./app.js";
import cloudinary from "cloudinary";


cloudinary.v2.config({
    cloud_name: process.env.CLOUDINARY_CLIENT_NAME,
    api_key: process.env.CLOUDINARY_CLIENT_APIKEY,
    api_secret: process.env.CLOUDINARY_CLIENT_APISECRET
})


app.listen(process.env.PORT, () => {
    console.log(`The server was running on port ${process.env.PORT}`);
})