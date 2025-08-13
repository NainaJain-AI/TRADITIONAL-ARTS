// Temporary rate limiting configuration for testing
const rateLimit = require('express-rate-limit');

// Very permissive rate limiting for testing (100 requests per minute)
const testingAuthRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // Allow 100 requests per minute for testing
  message: {
    success: false,
    message: 'Rate limit exceeded - testing mode (should rarely see this)'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Testing registration rate limit
const testingRegisterRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 50, // Allow 50 registration attempts per minute
  message: {
    success: false,
    message: 'Registration rate limit exceeded - testing mode'
  }
});

// Testing password reset rate limit
const testingPasswordResetRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20, // Allow 20 password reset attempts per minute
  message: {
    success: false,
    message: 'Password reset rate limit exceeded - testing mode'
  }
});

module.exports = {
  authRateLimit: testingAuthRateLimit,
  registerRateLimit: testingRegisterRateLimit,
  passwordResetRateLimit: testingPasswordResetRateLimit
};
