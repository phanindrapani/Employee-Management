import express from 'express';
import { protect } from '../../middlewares/auth.middleware.js';
import { upload } from '../../middlewares/upload.middleware.js';
import {
    uploadDocument,
    getDocuments,
    deleteDocument
} from '../../controllers/employee/document.controller.js';

const router = express.Router();

router.use(protect);

router.get('/', getDocuments);
router.post('/upload', upload.single('file'), uploadDocument);
router.delete('/:id', deleteDocument);

export default router;
