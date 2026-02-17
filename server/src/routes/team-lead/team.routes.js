import express from 'express';
import { getTeamMembers } from '../../controllers/team-lead/team.controller.js';
import { protect, authorizeRole } from '../../middlewares/auth.middleware.js';

const router = express.Router();

router.use(protect, authorizeRole(['team-lead', 'admin']));

router.get('/', getTeamMembers);

export default router;
