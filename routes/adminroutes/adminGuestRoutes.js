import express from "express";
import {isAuthorized} from "../../middlewares/authMiddleware.js";
import {isAdmin} from "../../middlewares/isAdmin.js";
import { getTotalGuestRegister } from "../../controllers/admin/AdminGuestContoller.js";

const router = express.Router();

// 🛡️ Protected route - only admin can access
router.get("/admin/total-guests", isAuthorized, isAdmin, getTotalGuestRegister);

export default router;


