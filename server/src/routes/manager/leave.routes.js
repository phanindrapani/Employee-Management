import express from 'express';
import { 
    getManagerLeaves, 
    getManagerLeaveStats, 
    updateLeaveStatus,
    applyManagerLeave,
    getManagerMyLeaves,
    calculateManagerLeave
} from '../../controllers/manager/leave.controller.js';
import upload from '../../middlewares/upload.middleware.js';

const router = express.Router();

router.get('/', getManagerLeaves);
router.get('/stats', getManagerLeaveStats);
router.put('/:id/status', updateLeaveStatus);

// Self-service routes
router.post('/', upload.single('attachment'), applyManagerLeave);
router.get('/my-leaves', getManagerMyLeaves);
router.post('/calculate', calculateManagerLeave);

export default router;
