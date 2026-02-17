import express from 'express';
import { getMyTasks, updateTaskStatus } from '../../controllers/employee/task.controller.js';
import { protect } from '../../middlewares/auth.middleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getMyTasks);
router.patch('/:id/status', updateTaskStatus);

export default router;
