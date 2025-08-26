// routes/amenityRoutes.js
import express from "express";
import {
  createAmenities,
  getAmenitiesByProperty,
  updateAmenities,
} from "../controllers/amenityController.js";
import { isAuthorized } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/:propertyId", isAuthorized, createAmenities); // POST /api/amenities
router.get("/:propertyId", getAmenitiesByProperty); // GET /api/amenities/:propertyId
router.put("/:propertyId",isAuthorized, updateAmenities); // PUT /api/amenities/:propertyId

export default router;
