import express from "express";
import { isAuthorized } from "../../middlewares/authMiddleware.js";
import { isAdmin } from "../../middlewares/isAdmin.js";
import { activeProperty, getPropertyLogs, inActiveProperty } from "../../controllers/admin/activePropertyController.js";

const router = express.Router();

// Inactivate a Property
router.put("/admin/inactivate/:propertyId", isAuthorized, isAdmin, inActiveProperty);

// Activate a Property
router.put("/admin/activate/:propertyId", isAuthorized, isAdmin, activeProperty);

// Get Property Logs (History)
router.get("/admin/logs/:propertyId", isAuthorized, isAdmin, getPropertyLogs);


export default router;
