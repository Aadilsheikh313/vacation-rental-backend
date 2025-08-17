import express from "express";
import { isAuthorized } from "../middlewares/authMiddleware.js";
import { isAdmin } from "../middlewares/isAdmin.js";
import { adminSearch, guestSearch, hostSearch } from "../controllers/globalSearchController.js";


const router = express.Router();

router.get("/admin/search", isAuthorized, isAdmin, adminSearch);
router.get("/guest/search", guestSearch);
router.get("/host/search", isAuthorized , hostSearch);

export default router;
