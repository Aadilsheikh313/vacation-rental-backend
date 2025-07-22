import express from "express";
import {  editProperty, getAllPropertyPosted, getMyExpiredProperty, getMyProperties, getPropertyByCategory, getSingleProperty, hardDeleteProperty, postProperty, reactiveProperty, softDeleteProperty } from "../controllers/propertyController.js";
import { isAuthorized } from "../middlewares/authMiddleware.js";
import { upload } from "../middlewares/uploadMiddleware.js";

const router = express.Router();

// ✅ STATIC ROUTES FIRST
router.get("/getAllPropertyPosted", getAllPropertyPosted);
router.get("/my-properties", isAuthorized, getMyProperties);

// ✅ THEN DYNAMIC ROUTES
router.get("/:id", getSingleProperty);
router.put("/edit/:id", isAuthorized, upload.single("image"), editProperty);

router.delete("/soft-delete/:id", isAuthorized, softDeleteProperty);
router.delete("/hard-delete/:id", isAuthorized, hardDeleteProperty);
router.put("/reactivate/:id", isAuthorized, reactiveProperty);
router.get("/expired/my", isAuthorized, getMyExpiredProperty);

// ✅ POST at the bottom or top (safe)
router.post("/postProperty", isAuthorized, upload.single("image"), postProperty);

//GET the Category wise property 
router.get("/category/:category", getPropertyByCategory);

export default router;
