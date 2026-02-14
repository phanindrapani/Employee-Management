import express from 'express';
import { addHoliday, getHolidays, deleteHoliday, updateHoliday } from '../controllers/holiday.controller.js';
import { protect, authorizeRole } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.route('/')
    .get(getHolidays)
    .post(protect, authorizeRole(['admin']), addHoliday);

router.route('/:id')
    .put(protect, authorizeRole(['admin']), updateHoliday)
    .delete(protect, authorizeRole(['admin']), deleteHoliday);

export default router;
