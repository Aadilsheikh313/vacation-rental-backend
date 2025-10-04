import express from "express";
import { isAuthorized } from "../middlewares/authMiddleware.js";
import { updateUserProfile, userProfile } from "../controllers/userController.js";
import { upload } from "../middlewares/uploadMiddleware.js";

const router = express.Router();

router.get("/profile", isAuthorized,userProfile);
router.put("/profile/update", isAuthorized,upload.single("avatar") ,updateUserProfile);

export default router;