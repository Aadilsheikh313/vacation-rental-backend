import express from "express";
import { isAuthorized } from "../middlewares/authMiddleware.js";
import { FilterRooms, PricesBaseFilter } from "../controllers/filterController.js";

const router = express.Router();

router.get("/priceFilter", isAuthorized, PricesBaseFilter);
router.post("/roomFilter", isAuthorized, FilterRooms);

export default router;