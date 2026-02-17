import express from 'express';
import dashboardRoutes from './dashboard.routes.js';
import teamRoutes from './team.routes.js';
import leaveRoutes from './leave.routes.js';
import projectRoutes from './project.routes.js';
import reportRoutes from './report.routes.js';
import taskRoutes from './task.routes.js';
import notificationRoutes from './notification.routes.js';

const router = express.Router();

router.use('/', dashboardRoutes); // mounts at /api/team-lead/ (so /api/team-lead/stats)
router.use('/team', teamRoutes);
router.use('/leaves', leaveRoutes);
router.use('/projects', projectRoutes);
router.use('/reports', reportRoutes);
router.use('/tasks', taskRoutes);
router.use('/notifications', notificationRoutes);

export default router;
