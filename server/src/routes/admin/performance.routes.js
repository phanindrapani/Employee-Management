import express from 'express';
import { protect, authorizeRole } from '../../middlewares/auth.middleware.js';
import {
    createPerformanceReview,
    getPerformanceReviews,
    triggerCalculation,
    getAdminPerformanceStats
} from '../../controllers/admin/performance.controller.js';

const router = express.Router();

// Reviews
router.post('/reviews', protect, authorizeRole(['admin', 'team-lead']), createPerformanceReview);
router.get('/reviews', protect, authorizeRole(['admin', 'team-lead', 'employee']), getPerformanceReviews);

// Advanced Analytics
router.post('/calculate', protect, authorizeRole(['admin']), triggerCalculation);
router.get('/dashboard', protect, authorizeRole(['admin']), getAdminPerformanceStats);

export default router;
