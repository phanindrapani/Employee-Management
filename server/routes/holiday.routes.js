import express from 'express';
import { addHoliday, getHolidays, deleteHoliday, updateHoliday } from '../controllers/holiday.controller.js';
import { protect, admin } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.route('/')
    .get(getHolidays)
    .post(protect, admin, addHoliday);

router.route('/:id')
    .put(protect, admin, updateHoliday)
    .delete(protect, admin, deleteHoliday);

export default router;
