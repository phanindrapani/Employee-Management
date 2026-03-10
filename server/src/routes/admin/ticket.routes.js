import express from 'express';
import { protect, authorizeRole } from '../../middlewares/auth.middleware.js';
import {
    getAllTickets,
    getTicketById,
    getAnalytics,
    getUnassignedTickets,
    getSLABreachedTickets,
    assignManager,
    closeTicket,
    addComment
} from '../../controllers/admin/ticket.controller.js';

const router = express.Router();

// Note: admin index.js already applies protect + authorizeRole(['admin'])

router.get('/analytics', getAnalytics);
router.get('/unassigned', getUnassignedTickets);
router.get('/sla-breached', getSLABreachedTickets);
router.get('/', getAllTickets);
router.get('/:id', getTicketById);
router.patch('/:id/assign-manager', assignManager);
router.patch('/:id/close', closeTicket);
router.post('/:id/comment', addComment);

export default router;
