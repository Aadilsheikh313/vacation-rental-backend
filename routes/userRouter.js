import express from "express";
import { isAuthorized } from "../middlewares/authMiddleware.js";
import { updateUserProfile, userProfile } from "../controllers/userController.js";
import { upload } from "../middlewares/uploadMiddleware.js";

const router = express.Router();

router.get("/profile", isAuthorized,userProfile);
router.put(
  "/profile/update",
  isAuthorized,
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "governmentIDImage", maxCount: 1 },
    { name: "cancelledChequeImage", maxCount: 1 },
    { name: "qrCode", maxCount: 1 },
  ]),
  updateUserProfile
);
export default router;