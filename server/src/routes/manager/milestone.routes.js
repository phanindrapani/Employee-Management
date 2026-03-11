import express from 'express';
import { protect, authorizeRole } from '../../middlewares/auth.middleware.js';
import {
    createMilestone,
    getProjectMilestones,
    updateMilestone,
    deleteMilestone,
    getProjectTasks
} from '../../controllers/manager/milestone.controller.js';

const router = express.Router();

router.use(protect, authorizeRole(['manager']));

router.get('/project/:projectId', getProjectMilestones);
router.get('/project/:projectId/tasks', getProjectTasks);
router.post('/', createMilestone);
router.put('/:id', updateMilestone);
router.delete('/:id', deleteMilestone);

export default router;
