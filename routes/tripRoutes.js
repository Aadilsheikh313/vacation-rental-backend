import express from 'express';
import { tripInfo } from '../controllers/tripController.js';

const router = express.Router();

router.get('/trip-info', tripInfo);

export default router;
