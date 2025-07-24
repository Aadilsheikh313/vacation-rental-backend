import { catchAsyncError } from "../../middlewares/catchAsyncError.js";
import { Property } from "../../models/Property.js";


//Get all posted property a admin
export const getAllPropertyAdmin = catchAsyncError(async (req, res, next) => {
    let AdmingetAllProperty = await Property.find({});
    res.status(200).json({
        success: true,
        AdmingetAllProperty,
    });
});