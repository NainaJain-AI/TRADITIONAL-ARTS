const express = require('express');
const { body } = require('express-validator');
const { auth } = require('../middleware/auth');
const { authRateLimit, registerRateLimit, passwordResetRateLimit } = require('../middleware/rateLimiting');
const { 
  register, 
  registerWithPhone,
  login, 
  loginWithPhone,
  adminLogin,
  forgotPassword, 
  resetPassword, 
  getMe, 
  logout, 
  verifyEmail, 
  resendVerificationEmail 
} = require('../controllers/auth.controller');

const router = express.Router();

router.post(
  '/register',
  registerRateLimit,
  [
    body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
    body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
    body('password').isLength({ min: 12 }).withMessage('Password must be at least 12 characters')
  ],
  register
);

// Phone registration route
router.post(
  '/register-phone',
  registerRateLimit,
  [
    body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
    body('phoneNumber').trim().isMobilePhone().withMessage('Please provide a valid phone number'),
    body('password').isLength({ min: 12 }).withMessage('Password must be at least 12 characters')
  ],
  registerWithPhone
);

router.post(
  '/login',
  authRateLimit,
  [
    body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
    body('password').exists().withMessage('Password is required')
  ],
  login
);

// Phone login route
router.post(
  '/login-phone',
  authRateLimit,
  [
    body('phoneNumber').trim().isMobilePhone().withMessage('Please provide a valid phone number'),
    body('password').exists().withMessage('Password is required')
  ],
  loginWithPhone
);

router.post(
  '/admin-login',
  authRateLimit,
  [
    body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
    body('password').exists().withMessage('Password is required')
  ],
  adminLogin
);

router.post(
  '/forgot-password',
  passwordResetRateLimit,
  [body('email').isEmail().normalizeEmail()],
  forgotPassword
);

router.put(
  '/reset-password/:resettoken',
  passwordResetRateLimit,
  [body('password').isLength({ min: 12 })],
  resetPassword
);

router.get('/me', auth, getMe);
router.post('/logout', auth, logout);

// Email verification routes
router.get('/verify-email/:token', verifyEmail);
router.post('/resend-verification', [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email')
], resendVerificationEmail);

module.exports = router;
