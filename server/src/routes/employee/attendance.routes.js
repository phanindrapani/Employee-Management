import express from 'express';
import { protect, authorizeRole } from '../../middlewares/auth.middleware.js';
import {
    checkIn,
    checkOut,
    getTodayAttendance,
    getMyAttendance
} from '../../controllers/employee/attendance.controller.js';

const router = express.Router();

router.use(protect, authorizeRole(['employee', 'team-lead', 'admin']));

router.post('/check-in', checkIn);
router.post('/check-out', checkOut);
router.get('/today', getTodayAttendance);
router.get('/', getMyAttendance);

export default router;
