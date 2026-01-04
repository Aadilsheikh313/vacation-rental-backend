import express from "express";
import {
    editReview,
    getAllReviewsForProperty,
    getReviewAnalytics,
    getReviewAnalyticsAdmin,
    hostReplyToReview,
    postReview,
    toggleReviewVisibility
} from "../controllers/reviewController.js";
import { isAuthorized } from "../middlewares/authMiddleware.js";
import { isAdmin } from "../middlewares/isAdmin.js";

const router = express.Router();
// Public
router.get("/property/:propertyId", getAllReviewsForProperty);

// Guest
router.post("/property/:propertyId", isAuthorized, postReview);
router.put("/review/:reviewId", isAuthorized, editReview);

// Host
router.post("/review/:reviewId/reply", isAuthorized, hostReplyToReview);
router.get("/property/:propertyId/analytics", isAuthorized, getReviewAnalytics);

// Admin
router.patch("/review/:reviewId/visibility", isAuthorized, isAdmin, toggleReviewVisibility);
router.get("/admin/property/:propertyId/analytics", isAuthorized, isAdmin, getReviewAnalyticsAdmin);


export default router