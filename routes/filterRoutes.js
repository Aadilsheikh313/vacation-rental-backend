import express from "express";
import { isAuthorized } from "../middlewares/authMiddleware.js";
import { PricesBaseFilter } from "../controllers/filterController.js";

const router = express.Router();

router.get("/priceFilter", isAuthorized, PricesBaseFilter);

export default router;