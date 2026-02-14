import express from 'express';
import { protect, authorizeRole } from '../middlewares/auth.middleware.js';
import { upload } from '../middlewares/upload.middleware.js';
import {
    uploadDocument,
    getDocuments,
    verifyDocument,
    rejectDocument,
    deleteDocument
} from '../controllers/employeeDocument.controller.js';

const router = express.Router();

// Base route: /api/documents

// Shared: Get docs (own or specific user for admin)
router.get('/', protect, getDocuments);

// Employee: Upload
router.post('/upload', protect, upload.single('file'), uploadDocument);

// Employee/Admin: Delete
router.delete('/:id', protect, deleteDocument);

// Admin: Verify/Reject
router.put('/:id/verify', protect, authorizeRole(['admin']), verifyDocument);
router.put('/:id/reject', protect, authorizeRole(['admin']), rejectDocument);

export default router;
