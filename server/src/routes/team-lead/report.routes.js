import express from 'express';
import { getTeamReports } from '../../controllers/team-lead/report.controller.js';
import { protect, authorizeRole } from '../../middlewares/auth.middleware.js';

const router = express.Router();

router.use(protect, authorizeRole(['team-lead', 'admin']));

router.get('/', getTeamReports);

export default router;
