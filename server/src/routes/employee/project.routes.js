import express from 'express';
import { protect } from '../../middlewares/auth.middleware.js';
import { getMyTeamProjects } from '../../controllers/employee/project.controller.js';

const router = express.Router();

router.use(protect);

router.get('/', getMyTeamProjects);

export default router;

