import { catchAsyncError } from "../../middlewares/catchAsyncError.js";
import { User } from "../../models/User.js";


export const getTotalGuestRegister = catchAsyncError(async (req, res, next) => {
    const totalGuests = await User.countDocuments({
        role: { $in: ["guest", "Guest"] }
    });

    res.status(200).json({
        success: true,
        totalGuest: totalGuests,
        message: `Total Guest: ${totalGuests}`
    });
});

