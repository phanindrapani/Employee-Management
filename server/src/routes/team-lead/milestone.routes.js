import express from 'express';
import { getProjectMilestones, getAllTeamMilestones, updateMilestoneStatus } from '../../controllers/team-lead/milestone.controller.js';
import { protect, authorizeRole } from '../../middlewares/auth.middleware.js';

const router = express.Router();

router.use(protect, authorizeRole(['team-lead', 'admin']));

router.get('/', getAllTeamMilestones);
router.get('/project/:projectId', getProjectMilestones);
router.patch('/:id/status', updateMilestoneStatus);

export default router;
