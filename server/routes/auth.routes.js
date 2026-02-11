import express from 'express';
import { registerUser, loginUser, getUserProfile, changePassword } from '../controllers/auth.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/profile', protect, getUserProfile);
router.post('/change-password', protect, changePassword);

export default router;
