import express from 'express';
import dashboardRoutes from './dashboard.routes.js';
import employeeRoutes from './employee.routes.js';
import departmentRoutes from './department.routes.js';
import teamRoutes from './team.routes.js';
import projectRoutes from './project.routes.js';
import holidayRoutes from './holiday.routes.js';
import leaveRoutes from './leave.routes.js';
import performanceRoutes from './performance.routes.js';
import settingsRoutes from './settings.routes.js';
import notificationRoutes from './notification.routes.js';
import documentRoutes from './document.routes.js';
import attendanceRoutes from './attendance.routes.js';
import ticketRoutes from './ticket.routes.js';
import clientRoutes from './client.routes.js';

const router = express.Router();

router.use('/', dashboardRoutes);
router.use('/employees', employeeRoutes);
router.use('/departments', departmentRoutes);
router.use('/teams', teamRoutes);
router.use('/projects', projectRoutes);
router.use('/holidays', holidayRoutes);
router.use('/leaves', leaveRoutes);
router.use('/performance', performanceRoutes);
router.use('/settings', settingsRoutes);
router.use('/notifications', notificationRoutes);
router.use('/documents', documentRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/tickets', ticketRoutes);
router.use('/clients', clientRoutes);

export default router;
