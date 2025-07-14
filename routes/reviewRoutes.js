import express from "express";
import { deleteReview, editReview, getAllReviewsForProperty, postReview } from "../controllers/reviewController.js";
import { isAuthorized } from "../middlewares/authMiddleware.js";



const router = express.Router();

router.post("/property/:propertyId", isAuthorized, postReview);
router.get("/property/:propertyId", getAllReviewsForProperty);
router.put("/property/:propertyId/review/:reviewId", isAuthorized, editReview);
router.delete("/property/:propertyId/review/:reviewId", isAuthorized, deleteReview);




export default router