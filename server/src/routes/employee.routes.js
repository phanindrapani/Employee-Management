import express from 'express';
import {
  addEmployee,
  getEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
} from '../controllers/employee.controller.js';
import upload from '../middlewares/upload.middleware.js';

const router = express.Router();

// Middleware to handle multipart/form-data
const fileUploads = upload.fields([
  { name: 'tenth', maxCount: 1 },
  { name: 'twelfth', maxCount: 1 },
  { name: 'degree', maxCount: 1 },
  { name: 'offerletter', maxCount: 1 },
  { name: 'joiningletter', maxCount: 1 },
  { name: 'resume', maxCount: 1 },
]);
router.route('/')
  .get(getEmployees)
  .post(fileUploads, addEmployee);

router.route('/:id')
  .get(getEmployeeById)
  .put(fileUploads, updateEmployee)
  .delete(deleteEmployee);
export default router;