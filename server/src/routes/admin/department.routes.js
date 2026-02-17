import express from 'express';
import { protect, authorizeRole } from '../../middlewares/auth.middleware.js';
import {
    createDepartment,
    getAllDepartments,
    updateDepartment,
    deleteDepartment
} from '../../controllers/admin/department.controller.js';

const router = express.Router();

router.use(protect, authorizeRole(['admin']));

router.post('/', createDepartment);
router.get('/', getAllDepartments);
router.put('/:id', updateDepartment);
router.delete('/:id', deleteDepartment);

export default router;
