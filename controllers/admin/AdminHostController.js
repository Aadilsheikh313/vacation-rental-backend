import { catchAsyncError } from "../../middlewares/catchAsyncError.js";
import { User } from "../../models/User.js";


export const getTotalHosts = catchAsyncError(async(req, res, next) =>{
    const totalHosts = await User.countDocuments({
        role: {$in :["host", "Host"]}
    });

     res.status(200).json({
        success: true,
        totalHosts,
        message: `Total  hosts: ${totalHosts}`
    });
});
