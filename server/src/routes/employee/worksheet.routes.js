import express from 'express';
import { protect, authorizeRole } from '../../middlewares/auth.middleware.js';
import worksheetUpload from '../../middlewares/worksheetUpload.middleware.js';
import {
    importWorksheet,
    getTemplate,
    getEntries,
    getAnalysis,
    exportEntries,
    saveEntries
} from '../../controllers/employee/worksheet.controller.js';

const router = express.Router();

router.use(protect);
router.use(authorizeRole(['employee', 'team-lead']));

router.post('/save', saveEntries);
router.post('/import', worksheetUpload.single('file'), importWorksheet);
router.get('/template', getTemplate);
router.get('/entries', getEntries);
router.get('/analysis', getAnalysis);
router.get('/export', exportEntries);

export default router;
