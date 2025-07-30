import mongoose from "mongoose";
import validator from "validator";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";


const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Please provide your name!"],
        minLength: [3, "Name must contain at least 3 characters! "],
        maxLength: [30, "Name cannot exceed 30 characters"],
    },
    email: {
        type: String,
        unique: true,
        required: [true, "Please provide your email!"],
        validate: [validator.isEmail, "Please provide a valid email!"],
        lowercase: true,

    },
    phone: {
        type: String,
        required: [true, "Please provide your phone number."],
        validate: {
            validator: function (v) {
                return /^[0-9]{10}$/.test(v); // 10-digit number
            },
            message: "Phone number must be 10 digits",
        },
    },

    password: {
        type: String,
        required: [true, " Please provide your password"],
        minLength: [8, "Password must contain at least 8 characters! "],
        select: false,
    },
    role: {
        type: String,
        required: [true, "Please provide your role"],
        enum: ["guest", "host", "Guest", "Host"],
    },
    lastLogin: {
        type: Date,
        default: null,
    },
    lastActiveAt: {
        type: Date,
        default: null,
    },
    loginCount: {
        type: Number,
        default: 0,
    },
    isBanned: {
        type: Boolean,
        default: false,
    },

    createdAt: {
        type: Date,
        default: Date.now,
    },

});

// HASING THE PASSWORD

userSchema.pre("save", async function (next) {

    // Capitalize the name's first letter
    if (this.name) {
        this.name = this.name.charAt(0).toUpperCase() + this.name.slice(1);
    }
    if (!this.isModified("password")) {
     return next();
    }
    this.password = await bcrypt.hash(this.password, 10);
 next();

});

// COMPARING PASSWORD
userSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

//GENERATING A JWT TOKEN FOR AUTHORIZATION
userSchema.methods.getJWTToken = function () {
    return jwt.sign({ id: this._id }, process.env.JWT_SECRET_KEY, {
        expiresIn: process.env.JWT_EXPIRE
    });
};


export const User = mongoose.model("User", userSchema);