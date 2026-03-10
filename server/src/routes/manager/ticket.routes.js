import express from 'express';
import {
    getMyTickets,
    getTicketById,
    getAnalytics,
    getStats,
    assignTeamLead,
    addComment
} from '../../controllers/manager/ticket.controller.js';

const router = express.Router();

// Note: manager index.js already applies protect + authorizeRole(['manager', 'admin'])

router.get('/analytics', getAnalytics);
router.get('/stats', getStats);
router.get('/', getMyTickets);
router.get('/:id', getTicketById);
router.patch('/:id/assign-teamlead', assignTeamLead);
router.post('/:id/comment', addComment);

export default router;
