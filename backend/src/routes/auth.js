const express = require('express');
const router = express.Router();
const { register, login, getMe, refreshToken } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refreshToken);

// Protected routes (need to be logged in)
router.get('/me', protect, getMe);

module.exports = router;
