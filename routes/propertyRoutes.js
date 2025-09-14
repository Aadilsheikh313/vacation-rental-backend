import express from "express";
import {  editProperty, getAllPropertyPosted, getMyExpiredProperty, getMyProperties, getNearbyProperties, getPropertyByCategory, getSingleProperty, hardDeleteProperty, postProperty, reactiveProperty, softDeleteProperty } from "../controllers/propertyController.js";
import { isAuthorized } from "../middlewares/authMiddleware.js";
import { upload } from "../middlewares/uploadMiddleware.js";

const router = express.Router();

//GET the NEAR PROPERTY AUTOMATIVE USER
router.get("/nearby", getNearbyProperties);

// ✅ STATIC ROUTES FIRST
router.get("/getAllPropertyPosted", getAllPropertyPosted);
router.get("/my-properties", isAuthorized, getMyProperties);

//GET the Category wise property 
router.get("/category/:category", getPropertyByCategory);

// ✅ THEN DYNAMIC ROUTES
router.get("/:id", getSingleProperty);
router.put("/edit/:id", isAuthorized, upload.single("image"), editProperty);

router.delete("/soft-delete/:id", isAuthorized, softDeleteProperty);
router.delete("/hard-delete/:id", isAuthorized, hardDeleteProperty);
router.put("/reactivate/:id", isAuthorized, reactiveProperty);
router.get("/expired/my", isAuthorized, getMyExpiredProperty);

// ✅ POST
router.post("/postProperty", isAuthorized, upload.single("image"), postProperty);




export default router;
