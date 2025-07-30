import express from "express";
import { isAuthorized } from "../../middlewares/authMiddleware.js";
import { isAdmin } from "../../middlewares/isAdmin.js";
import {
    getAdminAllActiveHosts,
    getAdminAllHosts,
    getAdminAllOnlineHosts,
    getTotalHosts
} from "../../controllers/admin/AdminHostController.js";

const router = express.Router();

// 🛡️ Protected route - only admin can access
router.get("/admin/total-hosts", isAuthorized, isAdmin, getTotalHosts);
router.get("/admin/all-hosts", isAuthorized, isAdmin, getAdminAllHosts);
router.get("/admin/active-hosts", isAuthorized, isAdmin, getAdminAllActiveHosts);
router.get("/admin/online-hosts", isAuthorized, isAdmin, getAdminAllOnlineHosts);
export default router;


