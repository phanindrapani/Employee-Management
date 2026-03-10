import { protect, authorizeRole } from '../../middlewares/auth.middleware.js';
import leaveRoutes from './leave.routes.js';
import taskRoutes from './task.routes.js';
import projectRoutes from './project.routes.js';
import documentRoutes from './document.routes.js';
import notificationRoutes from './notification.routes.js';
import attendanceRoutes from './attendance.routes.js';
import worksheetRoutes from './worksheet.routes.js';
import ticketRoutes from './ticket.routes.js';
import express from 'express';

const router = express.Router();

router.use(protect);
router.use(authorizeRole(['employee', 'manager', 'admin', 'team-lead']));

router.use('/leaves', leaveRoutes);
router.use('/tasks', taskRoutes);
router.use('/projects', projectRoutes);
router.use('/documents', documentRoutes);
router.use('/notifications', notificationRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/worksheet', worksheetRoutes);
router.use('/tickets', ticketRoutes);

export default router;
