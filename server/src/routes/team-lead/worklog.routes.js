import express from 'express';
import { getTeamLeadWorkLogs, getTeamLeadWorkLogStats, getTeamLeadWorkLogAnalysis } from '../../controllers/team-lead/worklog.controller.js';

const router = express.Router();

router.get('/', getTeamLeadWorkLogs);
router.get('/stats', getTeamLeadWorkLogStats);
router.get('/analysis', getTeamLeadWorkLogAnalysis);

export default router;
