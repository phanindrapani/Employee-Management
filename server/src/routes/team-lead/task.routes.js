import express from 'express';
import { getTeamTasks, createTask, deleteTask, updateTask } from '../../controllers/team-lead/task.controller.js';
import { protect, authorizeRole } from '../../middlewares/auth.middleware.js';

const router = express.Router();

router.use(protect, authorizeRole(['team-lead', 'admin']));

router.get('/', getTeamTasks);
router.post('/', createTask);
router.put('/:id', updateTask);
router.delete('/:id', deleteTask);

export default router;
