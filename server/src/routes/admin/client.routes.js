import express from 'express';
import { protect, authorizeRole } from '../../middlewares/auth.middleware.js';
import {
    getClients,
    getClientById,
    addClient,
    updateClient,
    deleteClient
} from '../../controllers/admin/client.controller.js';
import { uploadDocuments } from '../../middlewares/upload.middleware.js';

const router = express.Router();

router.use(protect, authorizeRole(['admin']));

router.get('/', getClients);
router.post('/', uploadDocuments, addClient);
router.get('/:id', getClientById);
router.put('/:id', uploadDocuments, updateClient);
router.delete('/:id', deleteClient);

export default router;
