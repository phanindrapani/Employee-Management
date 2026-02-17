import express from 'express';
import { applyLeave, getMyLeaves, getAllLeaves, updateLeaveStatus, calculateLeave } from '../controllers/leave.controller.js';
import { protect, authorizeRole } from '../middlewares/auth.middleware.js';
import upload from '../middlewares/upload.middleware.js';

const router = express.Router();

// Routes accessible by Employees, Team Leads, and Admins
router.route('/')
    .post(protect, authorizeRole(['employee', 'team-lead', 'admin']), upload.single('attachment'), applyLeave)
    .get(protect, authorizeRole(['employee', 'team-lead', 'admin']), getMyLeaves);

router.post('/calculate', protect, authorizeRole(['employee', 'team-lead', 'admin']), calculateLeave);

// Routes accessible by Admins and Team Leads
router.get('/all', protect, authorizeRole(['admin']), getAllLeaves);
router.put('/:id/status', protect, authorizeRole(['admin', 'team-lead']), updateLeaveStatus);

export default router;
