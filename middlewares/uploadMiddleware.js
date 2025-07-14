import multer from "multer"

// Store file in memory before uploading to Cloudinary
const storage = multer.memoryStorage();


export const upload = multer({storage});