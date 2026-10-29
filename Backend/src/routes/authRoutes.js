const express = require('express');
const router = express.Router();

const {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  getProfile,
  updateProfile,
  changePassword
} = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');
const { rateLimit } = require('../middlewares/rateLimitMiddleware');

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 });

// Routes mapping
router.post('/register', authLimiter, registerUser);
router.post('/login', authLimiter, loginUser);
router.post('/logout', logoutUser);
router.post('/refresh', refreshAccessToken);
router.get('/me', protect, getProfile);
router.patch('/me', protect, updateProfile);
router.patch('/change-password', protect, changePassword);

module.exports = router;