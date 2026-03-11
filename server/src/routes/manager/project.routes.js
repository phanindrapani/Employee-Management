import { getManagerProjects, getProjectStats, getTeamLeads, createProject, updateProject, deleteProject, getAllCompanyProjects } from '../../controllers/manager/project.controller.js';
import express from 'express';
import { protect, authorizeRole } from '../../middlewares/auth.middleware.js';

const router = express.Router();

router.use(protect, authorizeRole(['manager']));

router.get('/', getManagerProjects);
router.get('/all', getAllCompanyProjects);
router.get('/stats', getProjectStats);
router.get('/team-leads', getTeamLeads);

router.post('/', createProject);
router.put('/:id', updateProject);
router.delete('/:id', deleteProject);

export default router;