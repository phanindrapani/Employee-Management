import express from 'express';
import { protect, authorizeRole } from '../../middlewares/auth.middleware.js';
import worksheetUpload from '../../middlewares/worksheetUpload.middleware.js';
import {
    importWorksheet,
    getTemplate,
    getEntries,
    getAnalysis,
    exportEntries
} from '../../controllers/employee/worksheet.controller.js';

const router = express.Router();

// All routes require authentication
router.use(protect);
router.use(authorizeRole(['employee']));

// POST /api/employee/worksheet/import
router.post('/import', worksheetUpload.single('file'), importWorksheet);

// GET /api/employee/worksheet/template?format=csv|json|xlsx|docx
router.get('/template', getTemplate);

// GET /api/employee/worksheet/entries?fromDate=&toDate=&project=&status=&page=&limit=
router.get('/entries', getEntries);

// GET /api/employee/worksheet/analysis?fromDate=&toDate=
router.get('/analysis', getAnalysis);

// GET /api/employee/worksheet/export?format=csv|xlsx|pdf|docx&fromDate=&toDate=&project=&status=
router.get('/export', exportEntries);

export default router;
