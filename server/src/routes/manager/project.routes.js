import express from 'express';
import { getManagerProjects, getProjectStats } from '../../controllers/manager/project.controller.js';

const router = express.Router();

router.get('/', getManagerProjects);
router.get('/stats', getProjectStats);

export default router;
