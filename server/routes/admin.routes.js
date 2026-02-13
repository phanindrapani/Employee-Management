import express from 'express';
import { protect, admin } from '../middlewares/auth.middleware.js';
import {
    getDashboardStats,
    getReportStats,
    createEmployee,
    getAllEmployees,
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
    updateLeaveStatus
} from '../controllers/admin.controller.js';
import { uploadDocuments } from '../middlewares/upload.middleware.js';

const router = express.Router();

router.get('/stats', protect, admin, getDashboardStats);
router.get('/reports', protect, admin, getReportStats);

// Employee Management
router.post('/employees', protect, admin, uploadDocuments, createEmployee);
router.get('/employees', protect, admin, getAllEmployees);
router.delete('/employees/:id', protect, admin, deleteEmployee);

// Department Management
router.post('/departments', protect, admin, createDepartment);
router.get('/departments', protect, admin, getAllDepartments);
router.delete('/departments/:id', protect, admin, deleteDepartment);

// Team Management
router.post('/teams', protect, admin, createTeam);
router.get('/teams', protect, admin, getAllTeams);
router.patch('/teams/members', protect, admin, manageTeamMembers);
router.delete('/teams/:id', protect, admin, deleteTeam);

// Project Management
router.post('/projects', protect, admin, createProject);
router.get('/projects', protect, admin, getAllProjects);
router.patch('/projects/:id/status', protect, admin, updateProjectStatus);
router.delete('/projects/:id', protect, admin, deleteProject);

// Holiday Management
router.post('/holidays', protect, admin, createHoliday);
router.get('/holidays', protect, admin, getAllHolidays);
router.delete('/holidays/:id', protect, admin, deleteHoliday);

// Leave Management
router.get('/leaves', protect, admin, getAllLeaves);
router.put('/leaves/:id', protect, admin, updateLeaveStatus);

export default router;
