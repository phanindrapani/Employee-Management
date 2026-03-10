import express from 'express';
import { protect, authorizeRole } from '../../middlewares/auth.middleware.js';
import ticketRoutes from './ticket.routes.js';

const router = express.Router();

router.use(protect);
router.use(authorizeRole(['client']));

router.use('/tickets', ticketRoutes);

export default router;
