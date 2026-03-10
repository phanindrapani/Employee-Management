import express from 'express';
import { protect, authorizeRole } from '../../middlewares/auth.middleware.js';
import {
    addComment,
    reopenTicket,
    getClientStats,
    getClientProjects,
    createTicket,
    getMyTickets,
    getTicketById
} from '../../controllers/client/ticket.controller.js';
import { uploadAttachments } from '../../middlewares/upload.middleware.js';

const router = express.Router();

router.use(protect);
router.use(authorizeRole(['client']));

router.get('/stats', getClientStats);
router.get('/projects', getClientProjects);
router.get('/', getMyTickets);
router.get('/:id', getTicketById);
router.post('/', uploadAttachments, createTicket);
router.post('/:id/comment', addComment);
router.patch('/:id/reopen', reopenTicket);

export default router;
