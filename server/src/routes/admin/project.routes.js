import express from 'express';
import { protect, authorizeRole } from '../../middlewares/auth.middleware.js';
import {
    createProject,
    getAllProjects,
    updateProject,
    updateProjectStatus,
    deleteProject
} from '../../controllers/admin/project.controller.js';

const router = express.Router();

router.use(protect, authorizeRole(['admin']));

router.post('/', createProject);
router.get('/', getAllProjects);
router.put('/:id', updateProject);
router.patch('/:id/status', updateProjectStatus);
router.delete('/:id', deleteProject);

export default router;
