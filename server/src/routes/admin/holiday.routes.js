import express from 'express';
import { protect, authorizeRole } from '../../middlewares/auth.middleware.js';
import {
    createHoliday,
    getAllHolidays,
    deleteHoliday
} from '../../controllers/admin/holiday.controller.js';

const router = express.Router();

// Shared: Get Headers is open to all authenticated users
router.get('/', protect, getAllHolidays);

// Admin Only: Manage Holidays
router.post('/', protect, authorizeRole(['admin']), createHoliday);
router.delete('/:id', protect, authorizeRole(['admin']), deleteHoliday);

export default router;
