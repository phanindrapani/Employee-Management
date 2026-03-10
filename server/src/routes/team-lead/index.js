import express from 'express';
import { protect, authorizeRole } from '../../middlewares/auth.middleware.js';
import dashboardRoutes from './dashboard.routes.js';
import teamRoutes from './team.routes.js';
import leaveRoutes from './leave.routes.js';
import projectRoutes from './project.routes.js';
import reportRoutes from './report.routes.js';
import taskRoutes from './task.routes.js';
import notificationRoutes from './notification.routes.js';
import worklogRoutes from './worklog.routes.js';
import ticketRoutes from './ticket.routes.js';

const router = express.Router();

// Apply global protection
router.use(protect);
router.use(authorizeRole(['team-lead', 'admin']));

router.use('/team', teamRoutes);
router.use('/leaves', leaveRoutes);
router.use('/projects', projectRoutes);
router.use('/reports', reportRoutes);
router.use('/tasks', taskRoutes);
router.use('/notifications', notificationRoutes);
router.use('/worklogs', worklogRoutes);
router.use('/tickets', ticketRoutes);
router.use('/', dashboardRoutes);

export default router;
