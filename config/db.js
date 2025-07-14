
import mongoose from "mongoose";

 export const connectDB = () =>{
    mongoose.connect(process.env.MONGO_URL,{
        dbName: "MYDPROJECT",
    }).then(()=>{
        console.log("Connect to database");
    }).catch((err)=>{
        console.log(`Some error occured while connection to database: ${err}`);
    });
}