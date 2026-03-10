import express from 'express';
import {
    getMyTickets,
    getTicketById,
    getStats,
    updateStatus,
    addComment
} from '../../controllers/employee/ticket.controller.js';

const router = express.Router();

// Note: employee index.js already applies protect + authorizeRole(['employee'])

router.get('/stats', getStats);
router.get('/', getMyTickets);
router.get('/:id', getTicketById);
router.patch('/:id/status', updateStatus);
router.post('/:id/comment', addComment);

export default router;
