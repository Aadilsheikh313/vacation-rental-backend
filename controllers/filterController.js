import { catchAsyncError } from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../middlewares/errorMiddleware.js";
import { Property } from "../models/Property.js";



export const PricesBaseFilter = catchAsyncError(async(req , res , next) =>{
    const {sort} = req.query;

    let sortOption = {};

    if(sort === "lowToHigh"){
        sortOption = {price: 1};
    }else if(sort === "highToLow"){
        sortOption = {price: -1};
    }
    
    const properties = await Property.find({expired : false}).sort(sortOption);
   if(!properties || properties.length === 0){
    return next(new ErrorHandler("No properties found", 404));
   }
   
   res.status(200).json({
    success: true,
    count : properties.length,
    properties,
   })
})