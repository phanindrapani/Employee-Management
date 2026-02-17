import express from 'express';
import { protect, authorizeRole } from '../../middlewares/auth.middleware.js';
import {
    createTeam,
    getAllTeams,
    manageTeamMembers,
    updateTeam,
    deleteTeam
} from '../../controllers/admin/team.controller.js';

const router = express.Router();

router.use(protect, authorizeRole(['admin']));

router.post('/', createTeam);
router.get('/', getAllTeams);
router.put('/:id', updateTeam);
router.patch('/members', manageTeamMembers);
router.delete('/:id', deleteTeam);

export default router;
