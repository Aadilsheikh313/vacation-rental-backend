import express from 'express';
import { isAdmin } from '../../middlewares/isAdmin.js';
import { isAuthorized } from '../../middlewares/authMiddleware.js';
import {
    getAllPendingHosts,
    GetAllRejectHost,
    GetAllVerifedHost,
    verifyOrRejectHost
} from '../../controllers/admin/HostVerificationController.js';


const router = express.Router();

router.get('/pending-hosts', isAuthorized, isAdmin, getAllPendingHosts);
router.put('/verify-reject-host/:hostId', isAuthorized, isAdmin, verifyOrRejectHost);
router.get('/verified-hosts', isAuthorized, isAdmin, GetAllVerifedHost);
router.get('/rejected-hosts', isAuthorized, isAdmin, GetAllRejectHost);


export default router;