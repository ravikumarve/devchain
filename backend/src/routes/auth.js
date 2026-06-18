const express = require('express');
const router = express.Router();
const Joi = require('joi');
const { register, login, getMe, refreshToken } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

// ── Validation schemas ──
const registerSchema = {
  body: Joi.object({
    username: Joi.string().alphanum().min(3).max(30).lowercase().trim().required(),
    email: Joi.string().email().lowercase().trim().required(),
    password: Joi.string()
      .min(8)
      .max(128)
      .pattern(/^(?=.*[a-zA-Z])(?=.*\d)/)
      .message('Password must be at least 8 characters with at least 1 letter and 1 number')
      .required(),
  }),
};

const loginSchema = {
  body: Joi.object({
    email: Joi.string().email().lowercase().trim().required(),
    password: Joi.string().required(),
  }),
};

const refreshSchema = {
  body: Joi.object({
    refreshToken: Joi.string().required(),
  }),
};

// ── Routes ──
router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/refresh', validate(refreshSchema), refreshToken);
router.get('/me', protect, getMe);

module.exports = router;
