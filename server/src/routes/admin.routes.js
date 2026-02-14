import express from 'express';
import { protect, authorizeRole } from '../middlewares/auth.middleware.js';
import {
    getDashboardStats,
    getReportStats,
    createEmployee,
    getAllEmployees,
    getEmployeeById,
    updateEmployee,
    deleteEmployee,
    createDepartment,
    getAllDepartments,
    deleteDepartment,
    createTeam,
    getAllTeams,
    manageTeamMembers,
    deleteTeam,
    createProject,
    getAllProjects,
    updateProjectStatus,
    deleteProject,
    createHoliday,
    getAllHolidays,
    deleteHoliday,
    getAllLeaves,
    updateLeaveStatus,
    promoteUserAccount
} from '../controllers/admin.controller.js';
import { uploadDocuments } from '../middlewares/upload.middleware.js';

const router = express.Router();

router.get('/stats', protect, authorizeRole(['admin']), getDashboardStats);
router.get('/reports', protect, authorizeRole(['admin']), getReportStats);

// Employee Management
router.post('/employees', protect, authorizeRole(['admin']), uploadDocuments, createEmployee);
router.get('/employees', protect, authorizeRole(['admin']), getAllEmployees);
router.get('/employees/:id', protect, authorizeRole(['admin']), getEmployeeById);
router.put('/employees/:id', protect, authorizeRole(['admin']), uploadDocuments, updateEmployee); // Add this line
router.delete('/employees/:id', protect, authorizeRole(['admin']), deleteEmployee);

// Department Management
router.post('/departments', protect, authorizeRole(['admin']), createDepartment);
router.get('/departments', protect, authorizeRole(['admin']), getAllDepartments);
router.delete('/departments/:id', protect, authorizeRole(['admin']), deleteDepartment);

// Team Management
router.post('/teams', protect, authorizeRole(['admin']), createTeam);
router.get('/teams', protect, authorizeRole(['admin']), getAllTeams);
router.patch('/teams/members', protect, authorizeRole(['admin']), manageTeamMembers);
router.delete('/teams/:id', protect, authorizeRole(['admin']), deleteTeam);

// Project Management
router.post('/projects', protect, authorizeRole(['admin']), createProject);
router.get('/projects', protect, authorizeRole(['admin']), getAllProjects);
router.patch('/projects/:id/status', protect, authorizeRole(['admin']), updateProjectStatus);
router.delete('/projects/:id', protect, authorizeRole(['admin']), deleteProject);

// Holiday Management
router.post('/holidays', protect, authorizeRole(['admin']), createHoliday);
router.get('/holidays', protect, authorizeRole(['admin']), getAllHolidays);
router.delete('/holidays/:id', protect, authorizeRole(['admin']), deleteHoliday);

// Leave Management
router.put('/leaves/:id', protect, authorizeRole(['admin']), updateLeaveStatus);

// Role Management
router.post('/promote/:id', protect, authorizeRole(['admin']), promoteUserAccount);

export default router;
