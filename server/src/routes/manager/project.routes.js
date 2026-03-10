import { getManagerProjects, getProjectStats, getTeamLeads } from '../../controllers/manager/project.controller.js';
import express from 'express';

const router = express.Router();

router.get('/', getManagerProjects);
router.get('/stats', getProjectStats);
router.get('/team-leads', getTeamLeads);

export default router;
