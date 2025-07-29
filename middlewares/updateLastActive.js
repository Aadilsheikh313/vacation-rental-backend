import { User } from "../models/User.js";

export const updateActivity = async (req, res, next) => {
    try {
        if (req.user) {
            await User.findByIdAndUpdate(req.user._id, {
                lastActiveAt: new Date()
            });
        }
    } catch (error) {
        console.error("Activity update error:", error);
    }
    next();
};
