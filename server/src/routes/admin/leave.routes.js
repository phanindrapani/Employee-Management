import express from 'express';
import { protect, authorizeRole } from '../../middlewares/auth.middleware.js';
import {
    getAllLeaves,
    updateLeaveStatus
} from '../../controllers/admin/leave.controller.js';

const router = express.Router();

router.use(protect, authorizeRole(['admin']));

router.get('/', getAllLeaves);
router.put('/:id', updateLeaveStatus);

export default router;
