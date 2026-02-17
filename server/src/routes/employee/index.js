import express from 'express';
import leaveRoutes from './leave.routes.js';
import taskRoutes from './task.routes.js';
import projectRoutes from './project.routes.js';
import documentRoutes from './document.routes.js';
import notificationRoutes from './notification.routes.js';

const router = express.Router();

router.use('/leaves', leaveRoutes);
router.use('/tasks', taskRoutes);
router.use('/projects', projectRoutes);
router.use('/documents', documentRoutes);
router.use('/notifications', notificationRoutes);

export default router;
