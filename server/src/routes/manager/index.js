import express from 'express';
import { protect, authorizeRole } from '../../middlewares/auth.middleware.js';
import performanceRoutes from './performance.routes.js';
import projectRoutes from './project.routes.js';
import milestoneRoutes from './milestone.routes.js';
import taskRoutes from './task.routes.js';
import worklogRoutes from './worklog.routes.js';
import leaveRoutes from './leave.routes.js';
import ticketRoutes from './ticket.routes.js';
import teamRoutes from './team.routes.js';
import employeeRoutes from './employee.routes.js';
import dashboardRoutes from './dashboard.routes.js';

const router = express.Router();

// All manager routes require authentication and manager/admin role
router.use(protect);
router.use(authorizeRole(['manager', 'admin']));

router.use('/performance', performanceRoutes);
router.use('/projects', projectRoutes);
router.use('/milestones', milestoneRoutes);
router.use('/tasks', taskRoutes);
router.use('/worklogs', worklogRoutes);
router.use('/leaves', leaveRoutes);
router.use('/tickets', ticketRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/teams', teamRoutes);
router.use('/employees', employeeRoutes);

export default router;
