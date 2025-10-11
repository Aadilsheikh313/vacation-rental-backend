import express from "express";
import {login, logout, register } from "../controllers/authController.js";
import { isAuthorized } from "../middlewares/authMiddleware.js";
import { upload } from "../middlewares/uploadMiddleware.js";

const router = express.Router();

router.post(
  "/register",
  upload.fields([
    { name: "governmentIDImage", maxCount: 1 },
    { name: "cancelledChequeImage", maxCount: 1 },
    { name: "qrCode", maxCount: 1 },
  ]),
  register
);
router.post("/login", login);
router.post("/logout",  isAuthorized, logout);




export default  router;