import express from 'express';
import { getTeamMembers, calculateTeamPerformanceScore, getTeamMemberPerformance } from '../../controllers/team-lead/team.controller.js';
import { protect, authorizeRole } from '../../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/', getTeamMembers);
router.get('/performance', getTeamMemberPerformance);
router.post('/calculate-score', calculateTeamPerformanceScore);

export default router;
