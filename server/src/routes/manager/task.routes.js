import express from 'express';
import { getManagerTaskStats, getManagerOverdueTasks } from '../../controllers/manager/task.controller.js';

const router = express.Router();

router.get('/stats', getManagerTaskStats);
router.get('/overdue', getManagerOverdueTasks);

export default router;
