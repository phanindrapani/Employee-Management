import express from 'express';
import { getManagerPerformanceStats } from '../../controllers/manager/performance.controller.js';

const router = express.Router();

router.get('/dashboard', getManagerPerformanceStats);

export default router;
