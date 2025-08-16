import express from "express";
import { globalSearch } from "../controllers/globalSearchController.js";

const router = express.Router();

router.get("/global", (req, res, next) => {
  console.log("📌 Route Hit: /api/search/global");
  next();
}, globalSearch);

export default router;
