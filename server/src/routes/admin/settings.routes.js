import express from 'express';
import { protect, authorizeRole } from '../../middlewares/auth.middleware.js';
import { getLeaveSettings, updateLeaveSettings } from '../../controllers/admin/settings.controller.js';

const router = express.Router();

router.use(protect, authorizeRole(['admin']));

router.get('/leave', getLeaveSettings);
router.put('/leave', updateLeaveSettings);

export default router;
