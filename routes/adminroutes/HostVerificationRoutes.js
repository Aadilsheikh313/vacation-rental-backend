import express from 'express';
import { isAdmin } from '../../middlewares/isAdmin.js';
import { isAuthorized } from '../../middlewares/authMiddleware.js';
import {
    getAllPendingHosts,
    verifyOrRejectHost
} from '../../controllers/admin/HostVerificationController.js';


const router = express.Router();

router.get('/pending-hosts', isAuthorized, isAdmin, getAllPendingHosts);
router.put('/verify-reject-host/:hostId', isAuthorized, isAdmin, verifyOrRejectHost);


export default router;