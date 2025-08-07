import express from "express";
import { isAuthorized } from "../../middlewares/authMiddleware.js";
import { isAdmin } from "../../middlewares/isAdmin.js";
import { upload } from "../../middlewares/uploadMiddleware.js";
import { createExperienceAdmin } from "../../controllers/admin/adminPostExperience.js";

const router = express.Router();

router.post("/admin/postExperience",upload.single("image"), isAuthorized, isAdmin,  createExperienceAdmin);

export default router;
