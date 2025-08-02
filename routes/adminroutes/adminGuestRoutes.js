import express from "express";
import {isAuthorized} from "../../middlewares/authMiddleware.js";
import {isAdmin} from "../../middlewares/isAdmin.js";
import { getAdminAllActiveGuests,
     getAdminAllGuests, 
     getAdminAllOnlineGuests, 
     getAdminBannedGuests, 
     getAdminDailyActiveGuests,
      getAdminLogoutGuests,
      getAdminNewRegisterGuests,
      getTotalGuestRegister,
     } from "../../controllers/admin/AdminGuestContoller.js";

const router = express.Router();

// 🛡️ Protected route - only admin can access
router.get("/admin/total-guests", isAuthorized, isAdmin, getTotalGuestRegister);
router.get("/admin/all-guests", isAuthorized, isAdmin, getAdminAllGuests);
router.get("/admin/guests/active-week", isAuthorized, isAdmin, getAdminAllActiveGuests);
router.get("/admin/guests/active-today", isAuthorized, isAdmin, getAdminDailyActiveGuests);
router.get("/admin/guests/online", isAuthorized, isAdmin, getAdminAllOnlineGuests);
router.get("/admin/guests/logout", isAuthorized, isAdmin, getAdminLogoutGuests);
router.get("/admin/guests/new-today", isAuthorized, isAdmin, getAdminNewRegisterGuests);
router.get("/admin/guests/banned", isAuthorized, isAdmin, getAdminBannedGuests);

export default router;


