import express from 'express';
import {
    createTask,
    getTeamTasks,
    getMyTasks,
    updateTaskStatus,
    deleteTask
} from '../controllers/task.controller.js';
import { protect, authorizeRole } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Get personal tasks (Employee/TL/Admin)
router.get('/my', protect, getMyTasks);

// Update status (Employee/TL/Admin)
router.patch('/:id/status', protect, updateTaskStatus);

// Management routes (Team Lead only)
router.route('/team')
    .get(protect, authorizeRole(['team-lead']), getTeamTasks);

router.route('/')
    .post(protect, authorizeRole(['team-lead']), createTask);

router.route('/:id')
    .delete(protect, authorizeRole(['team-lead']), deleteTask);

export default router;
