import express from 'express';
import { protect, authorizeRole } from '../../middlewares/auth.middleware.js';
import {
    getAllLeaves,
    updateLeaveStatus,
    reconcileLeaveBalances
} from '../../controllers/admin/leave.controller.js';

const router = express.Router();

router.use(protect, authorizeRole(['admin']));

router.get('/', getAllLeaves);
router.post('/reconcile-balances', reconcileLeaveBalances);
router.put('/:id', updateLeaveStatus);

export default router;
