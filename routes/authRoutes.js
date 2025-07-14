import express from "express";
import {getUser, login, logout, register } from "../controllers/authController.js";
import { isAuthorized } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout",  isAuthorized, logout);
router.get("/getUser", isAuthorized, getUser);


export default  router;