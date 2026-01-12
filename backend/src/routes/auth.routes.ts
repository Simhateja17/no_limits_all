import { Router } from 'express';
import {
  register,
  login,
  logout,
  refreshToken,
  getCurrentUser,
  changePassword,
} from '../controllers/auth.controller.js';
import { authenticate, requireSuperAdmin } from '../middleware/auth.js';
import { authLimiter } from '../middleware/security.js';

const router = Router();

// Public routes (with strict rate limiting to prevent brute force)
router.post('/login', authLimiter, login);
router.post('/refresh', authLimiter, refreshToken);

// Protected routes (require authentication)
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getCurrentUser);
router.post('/change-password', authenticate, changePassword);

// Admin-only routes (only SUPER_ADMIN can create new users)
router.post('/register', requireSuperAdmin, register);

export default router;
