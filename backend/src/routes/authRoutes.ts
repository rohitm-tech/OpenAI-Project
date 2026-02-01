import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware';
import {
  register,
  login,
  logout,
  getCurrentUser,
} from '../controllers/authController';
import { googleAuth, googleCallback } from '../controllers/googleAuthController';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', authMiddleware, getCurrentUser);

// Google OAuth
router.get('/google', googleAuth);
router.get('/google/callback', googleCallback);

export default router;
