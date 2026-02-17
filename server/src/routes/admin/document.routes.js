import express from 'express';
import { protect, authorizeRole } from '../../middlewares/auth.middleware.js';
import upload from '../../middlewares/upload.middleware.js';
import {
    verifyDocument,
    rejectDocument,
    deleteDocument,
    getDocuments,
    uploadDocument
} from '../../controllers/admin/document.controller.js';

const router = express.Router();

router.use(protect, authorizeRole(['admin']));

router.get('/', getDocuments);
router.post('/upload', upload.single('file'), uploadDocument);
router.put('/:id/verify', verifyDocument);
router.put('/:id/reject', rejectDocument);
router.delete('/:id', deleteDocument);

export default router;
