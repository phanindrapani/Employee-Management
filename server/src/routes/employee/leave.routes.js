import express from 'express';
import { applyLeave, getMyLeaves, calculateLeave } from '../../controllers/employee/leave.controller.js';
import { protect, authorizeRole } from '../../middlewares/auth.middleware.js';
import upload from '../../middlewares/upload.middleware.js';

const router = express.Router();

router.use(protect, authorizeRole(['employee', 'team-lead', 'admin']));

router.post('/', upload.single('attachment'), applyLeave);
router.get('/', getMyLeaves);
router.post('/calculate', calculateLeave);

export default router;
