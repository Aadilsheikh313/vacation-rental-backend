import express from "express";
import { isAuthorized } from "../middlewares/authMiddleware.js";
import { userProfile } from "../controllers/userController.js";

const router = express.Router();

router.get("/profile", isAuthorized,userProfile);

export default router;