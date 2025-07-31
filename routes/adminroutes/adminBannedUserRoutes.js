import express from "express";
import { isAuthorized } from "../../middlewares/authMiddleware.js";
import { isAdmin } from "../../middlewares/isAdmin.js";
import { adminBannedUser, adminUnbanUser, getBanLogs } from "../../controllers/admin/adminBannedUserController.js";

const router = express.Router();

// ✅ Ban a user
router.put("/admin/ban/:userId", isAuthorized, isAdmin, adminBannedUser);

// ✅ Unban a user (only by same admin)
router.put("/admin/unban/:userId", isAuthorized, isAdmin, adminUnbanUser);

router.put("/admin/ban/:userId", isAuthorized, isAdmin, adminBannedUser);
router.put("/admin/unban/:userId", isAuthorized, isAdmin, adminUnbanUser);

router.get("/admin/ban-logs", isAuthorized, isAdmin, getBanLogs);


export default router;
