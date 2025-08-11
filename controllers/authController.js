
import { catchAsyncError } from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../middlewares/errorMiddleware.js";
import { User } from "../models/User.js";
import { sendToken } from "../utils/generateToken.js";



export const register = catchAsyncError(async (req, res, next) => {
    const { name, email, phone, role, password } = req.body;

    if (!name || !email || !phone || !role || !password) {
        return next(new ErrorHandler("Please fill full registration from!", 400));
    }

    const isEmail = await User.findOne({ email });
    if (isEmail) {
        return next(new ErrorHandler("Email is already exists"));

    }
    const user = await User.create({
        name, email, phone, role, password
    });

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

    const user = await User.findById(userId).select("-password"); // password hide
    if (!user) {
        return next(new ErrorHandler("User not found!", 404));
    }

    res.status(200).json({
        success: true,
        user, 
    });
});
