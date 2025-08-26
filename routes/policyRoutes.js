import express from "express";
import {  isAuthorized } from "../middlewares/authMiddleware.js";
import {
     createPolicy,
      getPolicyByProperty, 
      updatePolicy 
    } from "../controllers/policyController.js";

const router = express.Router();

// POST → create new policy
router.post("/:propertyId", isAuthorized, createPolicy);

// GET → fetch policy by propertyId
router.get("/:propertyId", getPolicyByProperty);

// PUT → update existing policy
router.put("/:propertyId", isAuthorized, updatePolicy);

export default router;
