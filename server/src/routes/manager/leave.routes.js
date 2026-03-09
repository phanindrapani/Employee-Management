import express from 'express';
import { getManagerLeaves, getManagerLeaveStats } from '../../controllers/manager/leave.controller.js';

const router = express.Router();

router.get('/', getManagerLeaves);
router.get('/stats', getManagerLeaveStats);

export default router;
