import cloudinary from "../config/cloudinary.js";
import streamifier from "streamifier";
import { catchAsyncError } from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../middlewares/errorMiddleware.js";
import { Host } from "../models/HostSchema.js";
import { User } from "../models/User.js";
import { sendToken } from "../utils/generateToken.js";


export const register = catchAsyncError(async (req, res, next) => {
    let {
        name,
        email,
        phone,
        role,
        password,
        governmentID,
        governmentIDNumber,
        governmentIDImage,
        cancelledChequeImage,
        payout,
    } = req.body;

    console.log(req.body);

    // images aayengi -> req.files se (multiple files)
    const files = req.files || {};

    if (!name || !email || !phone || !password || !role) {
        return next(new ErrorHandler("Please fill full registration form!", 400));
    }

    role = role.toLowerCase();

    const existing = await User.findOne({ email });
    if (existing) return next(new ErrorHandler("Email already exists", 400));

    const user = await User.create({ name, email, phone, role, password });

    // 🏠 Host Registration
    if (role === "host") {

        let governmentIDImage = {};
        let cancelledChequeImage = {};
        let qrCodeUrl = null;

        // ✅ Helper Function to upload file buffer to Cloudinary
        const uploadToCloudinary = async (fileBuffer, folderName) => {
            return new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    { folder: folderName },
                    (error, result) => {
                        if (result) resolve(result);
                        else reject(error);
                    }
                );
                streamifier.createReadStream(fileBuffer).pipe(stream);
            });
        };

        // ✅ Upload Government ID Image (if provided)
        if (files.governmentIDImage && files.governmentIDImage[0]) {
            const result = await uploadToCloudinary(
                files.governmentIDImage[0].buffer,
                "host_verifications/governmentID"
            );
            governmentIDImage = {
                public_id: result.public_id,
                url: result.secure_url,
            };
        }

        // ✅ Upload Cancelled Cheque Image (if provided)
        if (files.cancelledChequeImage && files.cancelledChequeImage[0]) {
            const result = await uploadToCloudinary(
                files.cancelledChequeImage[0].buffer,
                "host_verifications/cheque"
            );
            cancelledChequeImage = {
                public_id: result.public_id,
                url: result.secure_url,
            };
        }

        // ✅ Upload UPI QR Code (if provided)
        if (files.qrCode && files.qrCode[0]) {
            const result = await uploadToCloudinary(
                files.qrCode[0].buffer,
                "host_verifications/upi_qr"
            );
            qrCodeUrl = result.secure_url;
        }

        // ✅ Host Document Create
        const host = await Host.create({
            user: user._id,
            verificationStatus: "pending",
            governmentID: governmentID || null,
            governmentIDNumber: governmentIDNumber || null,
            governmentIDImage: governmentIDImage,
            cancelledChequeImage: cancelledChequeImage,
            payout: {
                ...payout,
                qrCodeUrl: qrCodeUrl || null,
            },
            appliedAt: new Date(),
            lastUpdatedAt: new Date(),
            audit: [
                {
                    action: "applied",
                    performedBy: user._id,
                    performedByModel: "User",
                    note: "Host registered and profile created",
                    date: new Date(),
                },
            ],
        });
    }

    sendToken(user, 200, res, "User Registered Successfully!");
});



export const login = catchAsyncError(async (req, res, next) => {

    const { role, email, password } = req.body;

    if (!role || !email || !password) {
        return next(new ErrorHandler("Please provide email, password, role", 400));
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select("+password");


    if (!user) {
        return next(new ErrorHandler("Invalid Email or Password", 400));
    }

    if (user.isBanned) {
        return next(new ErrorHandler("Your account has been banned.", 403));
    }

    const isPasswordMatched = await user.comparePassword(password);
    if (!isPasswordMatched) {
        return next(new ErrorHandler("Invalid Email or Password", 400));
    }

    user.loginCount = (user.loginCount || 0) + 1;

    if (user.role !== role) {
        return next(new ErrorHandler("User with role is not found!", 400));
    }

    await User.updateOne(
        { _id: user._id },
        {
            lastLogin: new Date(),
            lastActiveAt: new Date(),
            $inc: { loginCount: 1 }
        }
    );

    sendToken(user, 200, res, "User logged in successfully!");
})

export const logout = catchAsyncError(async (req, res, next) => {
    res.status(201).cookie("token", null, {
        httpOnly: true,
        expires: new Date(Date.now())
    }).json({
        success: true,
        message: "User logged out succesfully!",
    })
})

export const getUser = catchAsyncError(async (req, res, next) => {
    const userId = req.user._id; // JWT se mila ID

    const user = await User.findById(userId).select("-password");
    if (!user) {
        return next(new ErrorHandler("User not found!", 404));
    }

    res.status(200).json({
        success: true,
        user,
    });
});
