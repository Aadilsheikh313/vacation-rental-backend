import bcrypt from "bcryptjs";
import mongoose from "mongoose";


const adminSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Admin write a full name"]
    },
    email: {
        type: String,
        required: [true, "Admin email is required"],
        unique: true,
        lowercase: true,
    },
    password: {
        type: String,
        required: [true, "Admin password is required"],
        minlength: [8, "Password must be at least 8 characters long"],
        select: false,
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

}, {
    timestamps: true,
})

//Hasing the password
adminSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

//Compare Password
adminSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
}

export const Admin = mongoose.model("Admin", adminSchema);