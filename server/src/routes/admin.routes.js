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
    updateDepartment,
    createTeam,
    getAllTeams,
    manageTeamMembers,
    updateTeam,
    deleteTeam,
    createProject,
    getAllProjects,
    updateProject,
    updateProjectStatus,
    deleteProject,
    createHoliday,
    getAllHolidays,
    deleteHoliday,
    getAllLeaves,
    updateLeaveStatus,
    promoteUserAccount
} from '../controllers/admin.controller.js';
import { updateProjectProgress } from '../controllers/project.controller.js';
import {
    createGoal,
    getGoals,
    updateGoalStatus,
    deleteGoal,
    createPerformanceReview,
    getPerformanceReviews,
    triggerCalculation,
    getAdminPerformanceStats,
    getEmployeePerformanceProfile
} from '../controllers/performance.controller.js';
import { uploadDocuments } from '../middlewares/upload.middleware.js';

const router = express.Router();

router.get('/stats', protect, authorizeRole(['admin']), getDashboardStats);
router.get('/reports', protect, authorizeRole(['admin']), getReportStats);

// Employee Management
router.post('/employees', protect, authorizeRole(['admin']), uploadDocuments, createEmployee);
router.get('/employees', protect, authorizeRole(['admin']), getAllEmployees);
router.get('/employees/:id', protect, authorizeRole(['admin']), getEmployeeById);
router.put('/employees/:id', protect, authorizeRole(['admin']), uploadDocuments, updateEmployee);
router.delete('/employees/:id', protect, authorizeRole(['admin']), deleteEmployee);

// Department Management
router.post('/departments', protect, authorizeRole(['admin']), createDepartment);
router.get('/departments', protect, authorizeRole(['admin']), getAllDepartments);
router.put('/departments/:id', protect, authorizeRole(['admin']), updateDepartment);
router.delete('/departments/:id', protect, authorizeRole(['admin']), deleteDepartment);

// Team Management
router.post('/teams', protect, authorizeRole(['admin']), createTeam);
router.get('/teams', protect, authorizeRole(['admin']), getAllTeams);
router.put('/teams/:id', protect, authorizeRole(['admin']), updateTeam);
router.patch('/teams/members', protect, authorizeRole(['admin']), manageTeamMembers);
router.delete('/teams/:id', protect, authorizeRole(['admin']), deleteTeam);

// Project Management
router.post('/projects', protect, authorizeRole(['admin']), createProject);
router.get('/projects', protect, authorizeRole(['admin']), getAllProjects);
router.put('/projects/:id', protect, authorizeRole(['admin']), updateProject);
router.patch('/projects/:id/status', protect, authorizeRole(['admin']), updateProjectStatus);
router.delete('/projects/:id', protect, authorizeRole(['admin']), deleteProject);

// Holiday Management
router.post('/holidays', protect, authorizeRole(['admin']), createHoliday);
router.get('/holidays', protect, authorizeRole(['admin']), getAllHolidays);
router.delete('/holidays/:id', protect, authorizeRole(['admin']), deleteHoliday);

// Leave Management
router.get('/leaves', protect, authorizeRole(['admin']), getAllLeaves);
router.put('/leaves/:id', protect, authorizeRole(['admin']), updateLeaveStatus);

// Role Management
// Role Management
router.post('/promote/:id', protect, authorizeRole(['admin']), promoteUserAccount);

// ==================================================
// PERFORMANCE MODULE
// ==================================================

// Goals
router.post('/performance/goals', protect, authorizeRole(['admin', 'team-lead']), createGoal);
router.get('/performance/goals', protect, authorizeRole(['admin', 'team-lead', 'employee']), getGoals);
router.patch('/performance/goals/:id', protect, authorizeRole(['admin', 'team-lead', 'employee']), updateGoalStatus);
router.delete('/performance/goals/:id', protect, authorizeRole(['admin']), deleteGoal);

// Reviews
router.post('/performance/reviews', protect, authorizeRole(['admin', 'team-lead']), createPerformanceReview);
router.get('/performance/reviews', protect, authorizeRole(['admin', 'team-lead', 'employee']), getPerformanceReviews);

// Advanced Analytics
router.post('/performance/calculate', protect, authorizeRole(['admin']), triggerCalculation);
router.get('/performance/dashboard', protect, authorizeRole(['admin']), getAdminPerformanceStats);
router.get('/performance/employee/:id', protect, authorizeRole(['admin', 'team-lead', 'employee']), getEmployeePerformanceProfile);

export default router;
