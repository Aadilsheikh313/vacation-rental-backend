import express from "express";
import {isAuthorized} from "../../middlewares/authMiddleware.js";
import {isAdmin} from "../../middlewares/isAdmin.js";
import { getTotalHosts } from "../../controllers/admin/AdminHostController.js";

const router = express.Router();

// 🛡️ Protected route - only admin can access
router.get("/admin/total-hosts", isAuthorized, isAdmin, getTotalHosts);

export default router;


