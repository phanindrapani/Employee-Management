import express from 'express';
import { getTeamLeaves, updateLeaveStatus } from '../../controllers/team-lead/leave.controller.js';
import { protect, authorizeRole } from '../../middlewares/auth.middleware.js';

const router = express.Router();

router.use(protect, authorizeRole(['team-lead', 'admin']));

router.get('/', getTeamLeaves);
router.put('/:id/status', updateLeaveStatus);

export default router;
