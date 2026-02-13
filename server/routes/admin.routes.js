import express from 'express';
import { protect, admin } from '../middlewares/auth.middleware.js';
import {
    getDashboardStats,
    getReportStats,
    createEmployee,
    getAllEmployees,
    deleteEmployee
} from '../controllers/admin.controller.js';
import { uploadDocuments } from '../middlewares/upload.middleware.js';

const router = express.Router();

router.get('/stats', protect, admin, getDashboardStats);
router.get('/reports', protect, admin, getReportStats);

// Employee Management
router.post('/employees', protect, admin, uploadDocuments, createEmployee);
router.get('/employees', protect, admin, getAllEmployees);
router.delete('/employees/:id', protect, admin, deleteEmployee);

export default router;
