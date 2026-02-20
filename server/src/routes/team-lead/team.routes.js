import express from 'express';
import { getTeamMembers, calculateTeamPerformanceScore } from '../../controllers/team-lead/team.controller.js';
import { protect, authorizeRole } from '../../middlewares/auth.middleware.js';

const router = express.Router();

router.use(protect, authorizeRole(['team-lead', 'admin']));

router.get('/', getTeamMembers);
router.post('/calculate-score', calculateTeamPerformanceScore);

export default router;
