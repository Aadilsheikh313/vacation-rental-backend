import express from "express";
import { isAuthorized } from "../../middlewares/authMiddleware.js";
import { isAdmin } from "../../middlewares/isAdmin.js";
import { upload } from "../../middlewares/uploadMiddleware.js";
import { AdminEditPost, createExperienceAdmin, 
    getAllPostByAdmin, 
    getApprovedPostAdmin, 
    getSinglePostAdmin

} from "../../controllers/admin/adminPostExperience.js";

const router = express.Router();

router.get("/user-getallPosts", getApprovedPostAdmin);
router.get("/admin-getAllPosts", getAllPostByAdmin);
router.get("/admin/:id", getSinglePostAdmin);
router.put("/admin/adminedit/:id", isAuthorized, isAdmin, upload.single("image"), AdminEditPost);
router.post("/admin/postExperience", isAuthorized, isAdmin, upload.single("image"), createExperienceAdmin);

export default router;
