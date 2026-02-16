import express from 'express';
import {
    getTeamDashboardStats,
    getTeamMembers,
    getTeamLeaves,
    getTeamProjects
} from '../controllers/team.controller.js';
import { protect, authorizeRole } from '../middlewares/auth.middleware.js';

const router = express.Router();

// All routes require Team Member, Team Lead or Admin
router.use(protect, authorizeRole(['employee', 'team-lead', 'admin']));

router.get('/stats', getTeamDashboardStats);
router.get('/members', getTeamMembers);
router.get('/leaves', getTeamLeaves);
router.get('/projects', getTeamProjects);

export default router;
