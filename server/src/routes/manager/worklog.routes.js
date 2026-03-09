import express from 'express';
import { getManagerWorkLogs, getManagerWorkLogStats, getManagerWorkLogAnalysis } from '../../controllers/manager/worklog.controller.js';

const router = express.Router();

router.get('/', getManagerWorkLogs);
router.get('/stats', getManagerWorkLogStats);
router.get('/analysis', getManagerWorkLogAnalysis);

export default router;
