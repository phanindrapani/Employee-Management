import express from 'express';
import {
    getMyTickets,
    getTicketById,
    getStats,
    assignEmployee,
    addComment
} from '../../controllers/team-lead/ticket.controller.js';

const router = express.Router();

router.get('/stats', getStats);
router.get('/', getMyTickets);
router.get('/:id', getTicketById);
router.patch('/:id/assign-employee', assignEmployee);
router.post('/:id/comment', addComment);

export default router;
