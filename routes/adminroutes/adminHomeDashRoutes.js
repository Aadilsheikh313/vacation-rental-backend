import express from "express";
import { isAuthorized } from "../../middlewares/authMiddleware.js";
import {isAdmin} from "../../middlewares/isAdmin.js"
import { getAllPropertyAdmin, getSinglePropertyAdmin } from "../../controllers/admin/adminHomeDashboard.js";

const router = express.Router();

router.get("/admin/all-properties", isAuthorized, isAdmin, getAllPropertyAdmin);
router.get("/admin/property/:id",isAdmin, getSinglePropertyAdmin);

export default router;
