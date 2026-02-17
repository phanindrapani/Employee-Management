import express from 'express';
import { protect, authorizeRole } from '../../middlewares/auth.middleware.js';
import {
    getDashboardStats,
    getReportStats
} from '../../controllers/admin/dashboard.controller.js';

const router = express.Router();

router.use(protect, authorizeRole(['admin']));

router.get('/stats', getDashboardStats);
router.get('/reports', getReportStats);

export default router;
