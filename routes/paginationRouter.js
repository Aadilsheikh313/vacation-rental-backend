import express from "express";
import { getProperties } from "../utils/Pagination.js";


const router = express.Router();

// GET /api/properties
router.get("/pagination", getProperties);

export default router;
