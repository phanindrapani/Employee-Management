import express from 'express';
import { getManagerDashboardStats } from '../../controllers/manager/dashboard.controller.js';

const router = express.Router();

router.get('/stats', getManagerDashboardStats);

export default router;
