import express from 'express';
import {
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
  googleAuth,
} from '../controllers/authController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Public auth endpoints
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.post('/google', googleAuth);

// Protected session endpoint
router.get('/me', protect, getCurrentUser);

export default router;