import express from 'express';
import { protect, authorizeRole } from '../../middlewares/auth.middleware.js';
import {
    getEmployees,
    getEmployeeById,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    promoteUserAccount
} from '../../controllers/admin/employee.controller.js';
import { uploadDocuments } from '../../middlewares/upload.middleware.js';

const router = express.Router();

router.use(protect, authorizeRole(['admin']));

router.post('/', uploadDocuments, addEmployee);
router.get('/', getEmployees);
router.get('/:id', getEmployeeById);
router.put('/:id', uploadDocuments, updateEmployee);
router.delete('/:id', deleteEmployee);

export default router;
