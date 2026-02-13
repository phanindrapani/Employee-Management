import express from 'express';
import { registerUser, loginUser, getUserProfile, updateProfile, changePassword } from '../controllers/auth.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

import { upload } from '../middlewares/upload.middleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, upload.single('profilePicture'), updateProfile);
router.post('/change-password', protect, changePassword);

export default router;
