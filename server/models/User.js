const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: function() {
      return !this.phoneNumber; // Email required only if no phone number
    },
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true
  },
  phoneNumber: {
    type: String,
    required: function() {
      return !this.email; // Phone required only if no email
    },
    unique: true,
    sparse: true,
    trim: true
  },
  password: {
    type: String,
    required: function() {
      return !this.googleId; // Password required only if not Google OAuth
    }
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true
  },
  avatar: {
    type: String,
    default: null
  },
  resetPasswordToken: {
    type: String,
    default: null
  },
  resetPasswordExpire: {
    type: Date,
    default: null
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: {
    type: String,
    default: null
  },
  emailVerificationExpire: {
    type: Date,
    default: null
  },
  role: {
    type: String,
    enum: ['Admin', 'Artist'],
    default: 'Artist',
    required:true
  },
  
  // Artist-specific fields
  bio: {
    type: String,
    default: null
  },
  location: {
    type: String,
    default: null
  },
  specialization: {
    type: String,
    default: null
  },
  coverImage: {
    type: String,
    default: null
  },
  portfolioUrl: {
    type: String,
    default: null
  },
  socialLinks: {
    instagram: { type: String, default: null },
    twitter: { type: String, default: null },
    website: { type: String, default: null },
    behance: { type: String, default: null },
    linkedin: { type: String, default: null },
    youtube: { type: String, default: null }
  },
  
  // Artist artworks
  artworks: [{ type: String, default: [] }], // or you can ref artwork model
  
  // Verification system
  isVerified: {
    type: Boolean,
    default: false
  },
  verifiedAt: {
    type: Date,
    default: null
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  verificationDocuments: [{
    type: String, // URLs to verification documents
    default: []
  }],
  verificationNotes: {
    type: String,
    default: null
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'not_requested'],
    default: 'not_requested'
  },
  
  // Following system
  following: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }],
  followers: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }],
  
  // Track likes and bookmarks
  likes: [{ type: mongoose.Schema.Types.ObjectId }],
  bookmarks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Art' }],
  
  // Notifications system
  notifications: [{
    type: { 
      type: String, 
      enum: ['follow', 'like', 'bookmark', 'artwork_upload', 'verification_approved'], 
      required: true 
    },
    from: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User',
      required: true 
    },
    message: { 
      type: String, 
      required: true 
    },
    read: { 
      type: Boolean, 
      default: false 
    },
    createdAt: { 
      type: Date, 
      default: Date.now 
    }
  }],
  
  // Email notification preferences
  emailNotifications: {
    enabled: { 
      type: Boolean, 
      default: false 
    },
    followNotifications: { 
      type: Boolean, 
      default: false 
    },
    likeNotifications: { 
      type: Boolean, 
      default: false 
    },
    artworkNotifications: { 
      type: Boolean, 
      default: false 
    }
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Generate password reset token
userSchema.methods.getResetPasswordToken = function() {
  const resetToken = require('crypto').randomBytes(32).toString('hex');
  
  this.resetPasswordToken = require('crypto')
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
  
  return resetToken;
};

// Generate password reset token (for compatibility)
userSchema.methods.generatePasswordReset = function() {
  return this.getResetPasswordToken();
};

// Generate email verification token
userSchema.methods.generateEmailVerificationToken = function() {
  const verificationToken = require('crypto').randomBytes(32).toString('hex');
  
  this.emailVerificationToken = require('crypto')
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');
  
  this.emailVerificationExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  
  return verificationToken;
};


// Enhanced password validation
userSchema.methods.validatePasswordStrength = function(password) {
  const requirements = {
    minLength: password.length >= 12, // Increased from 8 to 12
    hasUpperCase: /[A-Z]/.test(password),
    hasLowerCase: /[a-z]/.test(password),
    hasNumbers: /\d/.test(password),
    hasSpecialChars: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    noCommonPatterns: !/password|123456|qwerty|admin|user/i.test(password)
  };
  
  const score = Object.values(requirements).filter(Boolean).length;
  return {
    isValid: score >= 5, // Must meet at least 5 out of 6 requirements
    requirements,
    score
  };
};

module.exports = mongoose.model('User', userSchema);
