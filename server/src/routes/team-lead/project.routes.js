import express from 'express';
import { getTeamProjects, updateProjectProgress } from '../../controllers/team-lead/project.controller.js';
import { protect, authorizeRole } from '../../middlewares/auth.middleware.js';

const router = express.Router();

router.use(protect, authorizeRole(['team-lead', 'admin']));

router.get('/', getTeamProjects);
router.put('/:id/progress', updateProjectProgress);

export default router;
