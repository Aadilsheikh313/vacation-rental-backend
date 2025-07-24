import express from "express";
import { isAuthorized } from "../../middlewares/authMiddleware.js";
import {isAdmin} from "../../middlewares/isAdmin.js"
import { getAllPropertyAdmin } from "../../controllers/admin/adminHomeDashboard.js";

const router = express.Router();

router.get("/admin/all-properties", isAuthorized, isAdmin, getAllPropertyAdmin);

export default router;
