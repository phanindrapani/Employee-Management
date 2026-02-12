import express from 'express';
import { applyLeave, getMyLeaves, getAllLeaves, updateLeaveStatus, calculateLeave } from '../controllers/leave.controller.js';
import { protect, admin } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.route('/')
    .post(protect, applyLeave)
    .get(protect, getMyLeaves);

router.get('/all', protect, admin, getAllLeaves);
router.post('/calculate', protect, calculateLeave);
router.put('/:id/status', protect, admin, updateLeaveStatus);

export default router;
