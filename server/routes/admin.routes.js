import express from 'express';
import { protect, admin } from '../middlewares/auth.middleware.js';
import { getDashboardStats, getReportStats } from '../controllers/admin.controller.js';

const router = express.Router();

router.get('/stats', protect, admin, getDashboardStats);
router.get('/reports', protect, admin, getReportStats);

export default router;
