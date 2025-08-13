const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const deepInvestigation = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/kalasangam');
    console.log('🔍 Connected to MongoDB for Deep Investigation');
    
    const db = mongoose.connection.db;
    
    // 1. List all collections in the database
    console.log('\n=== DATABASE COLLECTIONS ===');
    const collections = await db.listCollections().toArray();
    collections.forEach((collection, index) => {
      console.log(`${index + 1}. ${collection.name}`);
    });
    
    // 2. Check for test.adminprofiles collection specifically
    console.log('\n=== CHECKING FOR test.adminprofiles COLLECTION ===');
    const adminProfilesExists = collections.find(c => c.name === 'test.adminprofiles');
    if (adminProfilesExists) {
      console.log('⚠️  FOUND: test.adminprofiles collection exists!');
      const adminProfilesCollection = db.collection('test.adminprofiles');
      const adminProfiles = await adminProfilesCollection.find({}).toArray();
      console.log(`Found ${adminProfiles.length} documents in test.adminprofiles:`);
      adminProfiles.forEach((profile, index) => {
        console.log(`\n${index + 1}. Profile:`, JSON.stringify(profile, null, 2));
      });
    } else {
      console.log('❌ test.adminprofiles collection not found');
    }
    
    // 3. Check for suspicious collections
    console.log('\n=== SUSPICIOUS COLLECTIONS CHECK ===');
    const suspiciousPatterns = ['admin', 'hack', 'temp', 'test', 'backup', 'dump'];
    collections.forEach(collection => {
      const name = collection.name.toLowerCase();
      if (suspiciousPatterns.some(pattern => name.includes(pattern))) {
        console.log(`⚠️  Suspicious collection: ${collection.name}`);
      }
    });
    
    // 4. Analyze all admin accounts with IP and session data
    console.log('\n=== COMPREHENSIVE ADMIN ANALYSIS ===');
    const adminUsers = await User.find({ role: 'Admin' });
    
    for (const admin of adminUsers) {
      console.log(`\n--- Admin Account: ${admin.name} ---`);
      console.log(`Email: ${admin.email}`);
      console.log(`ID: ${admin._id}`);
      console.log(`Created: ${admin.createdAt}`);
      console.log(`Updated: ${admin.updatedAt}`);
      console.log(`Email Verified: ${admin.isEmailVerified}`);
      
      // Check for suspicious patterns
      const suspiciousIndicators = [];
      
      if (admin.email && (admin.email.includes('.ru') || admin.email.includes('russia') || admin.email.includes('moscow'))) {
        suspiciousIndicators.push('Russian email domain/keywords');
      }
      
      if (admin.name && (admin.name.toLowerCase().includes('admin') || admin.name.toLowerCase().includes('root') || admin.name.toLowerCase().includes('hack'))) {
        suspiciousIndicators.push('Suspicious name pattern');
      }
      
      const accountAge = Math.floor((new Date() - new Date(admin.createdAt)) / (1000 * 60 * 60 * 24));
      if (accountAge < 7) {
        suspiciousIndicators.push(`Recently created (${accountAge} days old)`);
      }
      
      if (admin.isEmailVerified && accountAge < 1) {
        suspiciousIndicators.push('Instantly verified email (suspicious for new account)');
      }
      
      if (suspiciousIndicators.length > 0) {
        console.log('🚨 SECURITY ALERTS:');
        suspiciousIndicators.forEach((indicator, i) => {
          console.log(`   ${i + 1}. ${indicator}`);
        });
      } else {
        console.log('✅ No immediate red flags');
      }
    }
    
    // 5. Check for recent authentication attempts (if we have session data)
    console.log('\n=== CHECKING FOR SESSION/AUTH COLLECTIONS ===');
    const authRelatedCollections = collections.filter(c => 
      c.name.toLowerCase().includes('session') || 
      c.name.toLowerCase().includes('auth') || 
      c.name.toLowerCase().includes('login')
    );
    
    if (authRelatedCollections.length > 0) {
      console.log('Found authentication-related collections:');
      authRelatedCollections.forEach(collection => {
        console.log(`- ${collection.name}`);
      });
    } else {
      console.log('No session/auth collections found');
    }
    
    // 6. Look for any admin accounts created today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todaysAdmins = await User.find({
      role: 'Admin',
      createdAt: { $gte: today }
    });
    
    if (todaysAdmins.length > 0) {
      console.log('\n🚨 ADMINS CREATED TODAY:');
      todaysAdmins.forEach((admin, index) => {
        console.log(`${index + 1}. ${admin.name} (${admin.email}) - Created: ${admin.createdAt}`);
      });
    }
    
    // 7. Check for password reset attempts
    const usersWithResetTokens = await User.find({
      resetPasswordToken: { $ne: null }
    });
    
    if (usersWithResetTokens.length > 0) {
      console.log('\n⚠️  USERS WITH ACTIVE PASSWORD RESET TOKENS:');
      usersWithResetTokens.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name} (${user.email}) - Role: ${user.role}`);
      });
    }
    
    console.log('\n🔍 Investigation Complete');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error during deep investigation:', error.message);
    process.exit(1);
  }
};

deepInvestigation();

const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const deepInvestigation = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/kalasangam');
    console.log('🔍 Connected to MongoDB for Deep Investigation');
    
    const db = mongoose.connection.db;
    
    // 1. List all collections in the database
    console.log('\n=== DATABASE COLLECTIONS ===');
    const collections = await db.listCollections().toArray();
    collections.forEach((collection, index) => {
      console.log(`${index + 1}. ${collection.name}`);
    });
    
    // 2. Check for test.adminprofiles collection specifically
    console.log('\n=== CHECKING FOR test.adminprofiles COLLECTION ===');
    const adminProfilesExists = collections.find(c => c.name === 'test.adminprofiles');
    if (adminProfilesExists) {
      console.log('⚠️  FOUND: test.adminprofiles collection exists!');
      const adminProfilesCollection = db.collection('test.adminprofiles');
      const adminProfiles = await adminProfilesCollection.find({}).toArray();
      console.log(`Found ${adminProfiles.length} documents in test.adminprofiles:`);
      adminProfiles.forEach((profile, index) => {
        console.log(`\n${index + 1}. Profile:`, JSON.stringify(profile, null, 2));
      });
    } else {
      console.log('❌ test.adminprofiles collection not found');
    }
    
    // 3. Check for suspicious collections
    console.log('\n=== SUSPICIOUS COLLECTIONS CHECK ===');
    const suspiciousPatterns = ['admin', 'hack', 'temp', 'test', 'backup', 'dump'];
    collections.forEach(collection => {
      const name = collection.name.toLowerCase();
      if (suspiciousPatterns.some(pattern => name.includes(pattern))) {
        console.log(`⚠️  Suspicious collection: ${collection.name}`);
      }
    });
    
    // 4. Analyze all admin accounts with IP and session data
    console.log('\n=== COMPREHENSIVE ADMIN ANALYSIS ===');
    const adminUsers = await User.find({ role: 'Admin' });
    
    for (const admin of adminUsers) {
      console.log(`\n--- Admin Account: ${admin.name} ---`);
      console.log(`Email: ${admin.email}`);
      console.log(`ID: ${admin._id}`);
      console.log(`Created: ${admin.createdAt}`);
      console.log(`Updated: ${admin.updatedAt}`);
      console.log(`Email Verified: ${admin.isEmailVerified}`);
      
      // Check for suspicious patterns
      const suspiciousIndicators = [];
      
      if (admin.email && (admin.email.includes('.ru') || admin.email.includes('russia') || admin.email.includes('moscow'))) {
        suspiciousIndicators.push('Russian email domain/keywords');
      }
      
      if (admin.name && (admin.name.toLowerCase().includes('admin') || admin.name.toLowerCase().includes('root') || admin.name.toLowerCase().includes('hack'))) {
        suspiciousIndicators.push('Suspicious name pattern');
      }
      
      const accountAge = Math.floor((new Date() - new Date(admin.createdAt)) / (1000 * 60 * 60 * 24));
      if (accountAge < 7) {
        suspiciousIndicators.push(`Recently created (${accountAge} days old)`);
      }
      
      if (admin.isEmailVerified && accountAge < 1) {
        suspiciousIndicators.push('Instantly verified email (suspicious for new account)');
      }
      
      if (suspiciousIndicators.length > 0) {
        console.log('🚨 SECURITY ALERTS:');
        suspiciousIndicators.forEach((indicator, i) => {
          console.log(`   ${i + 1}. ${indicator}`);
        });
      } else {
        console.log('✅ No immediate red flags');
      }
    }
    
    // 5. Check for recent authentication attempts (if we have session data)
    console.log('\n=== CHECKING FOR SESSION/AUTH COLLECTIONS ===');
    const authRelatedCollections = collections.filter(c => 
      c.name.toLowerCase().includes('session') || 
      c.name.toLowerCase().includes('auth') || 
      c.name.toLowerCase().includes('login')
    );
    
    if (authRelatedCollections.length > 0) {
      console.log('Found authentication-related collections:');
      authRelatedCollections.forEach(collection => {
        console.log(`- ${collection.name}`);
      });
    } else {
      console.log('No session/auth collections found');
    }
    
    // 6. Look for any admin accounts created today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todaysAdmins = await User.find({
      role: 'Admin',
      createdAt: { $gte: today }
    });
    
    if (todaysAdmins.length > 0) {
      console.log('\n🚨 ADMINS CREATED TODAY:');
      todaysAdmins.forEach((admin, index) => {
        console.log(`${index + 1}. ${admin.name} (${admin.email}) - Created: ${admin.createdAt}`);
      });
    }
    
    // 7. Check for password reset attempts
    const usersWithResetTokens = await User.find({
      resetPasswordToken: { $ne: null }
    });
    
    if (usersWithResetTokens.length > 0) {
      console.log('\n⚠️  USERS WITH ACTIVE PASSWORD RESET TOKENS:');
      usersWithResetTokens.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name} (${user.email}) - Role: ${user.role}`);
      });
    }
    
    console.log('\n🔍 Investigation Complete');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error during deep investigation:', error.message);
    process.exit(1);
  }
};

deepInvestigation();
