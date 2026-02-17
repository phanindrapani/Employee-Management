import express from 'express';
import { getTeamDashboardStats } from '../../controllers/team-lead/dashboard.controller.js';
import { protect, authorizeRole } from '../../middlewares/auth.middleware.js';

const router = express.Router();

router.use(protect, authorizeRole(['team-lead', 'admin']));

router.get('/stats', getTeamDashboardStats);

export default router;
