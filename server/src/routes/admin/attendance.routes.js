import express from 'express';
import { protect, authorizeRole } from '../../middlewares/auth.middleware.js';
import { getDailyAttendance } from '../../controllers/admin/attendance.controller.js';

const router = express.Router();

router.use(protect, authorizeRole(['admin']));

router.get('/', getDailyAttendance);

export default router;
