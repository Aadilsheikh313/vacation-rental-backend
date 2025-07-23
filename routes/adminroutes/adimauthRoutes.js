import express from "express";
import { adminLogin, adminLogout, adminRegister } from "../../controllers/admin/adminauthController.js";

const router = express.Router();

router.post("/admin/register", adminRegister);
router.post("/admin/login", adminLogin);
router.get("/admin/logout", adminLogout);


export default router;

