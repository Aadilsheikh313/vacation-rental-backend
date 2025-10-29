import express from 'express';
import { isAdmin } from '../../middlewares/isAdmin.js';
import { isAuthorized } from '../../middlewares/authMiddleware.js';
import {
    getAllPendingHosts,
    GetAllRejectHost,
    GetAllVerifedHost,
    ReVerification,
    verifyOrRejectHost
} from '../../controllers/admin/HostVerificationController.js';


const router = express.Router();

router.get('/pending-hosts', isAuthorized, isAdmin, getAllPendingHosts);
router.get('/verified-hosts', isAuthorized, isAdmin, GetAllVerifedHost);
router.get('/rejected-hosts', isAuthorized, isAdmin, GetAllRejectHost);
router.put('/verify-reject-host/:hostId', isAuthorized, isAdmin, verifyOrRejectHost);
router.put('/reverify-host/:hostId', isAuthorized, isAdmin, ReVerification);


export default router;