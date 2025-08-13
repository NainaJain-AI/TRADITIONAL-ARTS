const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'No token, authorization denied' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Token is not valid' 
      });
    }

    // Ensure userId is properly set for compatibility
    req.user = {
      userId: user._id,
      id: user._id, // Add both for compatibility
      role: user.role,
      name: user.name,
      email: user.email,
      isEmailVerified: user.isEmailVerified,
      ...user.toObject()
    };
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    res.status(401).json({ 
      success: false, 
      message: 'Token is not valid',
      error: error.message
    });
  }
};

// Role-based authorization middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Please login first.'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${roles.join(' or ')}. Your role: ${req.user.role}`
      });
    }

    next();
  };
};

// Optional authentication - doesn't reject unauthenticated requests
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      // No token provided, continue without user info
      req.user = null;
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      // Invalid token, continue without user info
      req.user = null;
      return next();
    }

    // Set user info if valid token
    req.user = {
      userId: user._id,
      id: user._id, // Add both for compatibility
      role: user.role,
      name: user.name,
      email: user.email,
      isEmailVerified: user.isEmailVerified,
      ...user.toObject()
    };
    
    next();
  } catch (error) {
    // Invalid token, continue without user info
    console.log('Optional auth middleware - invalid token:', error.message);
    req.user = null;
    next();
  }
};

// Specific role middleware for common use cases
const adminOnly = authorize('Admin');
const artistOrAdmin = authorize('Artist', 'Admin');
const authenticatedOnly = auth;

module.exports = {
  auth,
  authorize,
  adminOnly,
  artistOrAdmin,
  authenticatedOnly,
  optionalAuth
};
