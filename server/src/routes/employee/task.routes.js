import express from 'express';
import { getMyTasks, updateTaskStatus, updateTaskContent } from '../../controllers/employee/task.controller.js';
import { protect } from '../../middlewares/auth.middleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getMyTasks);
router.patch('/:id/status', updateTaskStatus);
router.patch('/:id/content', updateTaskContent);

export default router;
