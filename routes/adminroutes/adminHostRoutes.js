import express from "express";
import { isAuthorized } from "../../middlewares/authMiddleware.js";
import { isAdmin } from "../../middlewares/isAdmin.js";
import {
    getAdminAllActiveHosts,
    getAdminAllHosts,
    getAdminAllOnlineHosts,
    getAdminBannedHosts,
    getAdminLogoutHosts,
    getAdminNewRegisterHosts,
} from "../../controllers/admin/AdminHostController.js";

const router = express.Router();

// 🛡️ Protected route - only admin can access
router.get("/admin/all-hosts", isAuthorized, isAdmin, getAdminAllHosts);
router.get("/admin/active-hosts", isAuthorized, isAdmin, getAdminAllActiveHosts);
router.get("/admin/online-hosts", isAuthorized, isAdmin, getAdminAllOnlineHosts);
router.get("/admin/new-hosts", isAuthorized, isAdmin, getAdminNewRegisterHosts);
router.get("/admin/logout-hosts", isAuthorized, isAdmin, getAdminLogoutHosts);
router.get("/admin/banned-hosts", isAuthorized, isAdmin, getAdminBannedHosts);
export default router;


