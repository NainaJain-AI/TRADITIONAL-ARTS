const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const investigateAdmins = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/kalasangam');
    console.log('Connected to MongoDB');
    
    // Get all users with detailed information including timestamps
    const users = await User.find({}).select('name email role createdAt updatedAt isEmailVerified');
    console.log('\n=== ALL USERS WITH TIMESTAMPS ===');
    users.forEach((user, index) => {
      console.log(`\n${index + 1}. User: ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Created: ${user.createdAt}`);
      console.log(`   Updated: ${user.updatedAt}`);
      console.log(`   Email Verified: ${user.isEmailVerified}`);
    });
    
    // Focus on Admin accounts specifically
    const adminUsers = await User.find({ role: 'Admin' });
    console.log('\n=== ADMIN ACCOUNTS DETAILED ANALYSIS ===');
    adminUsers.forEach((admin, index) => {
      console.log(`\nAdmin ${index + 1}:`);
      console.log(`   Name: ${admin.name}`);
      console.log(`   Email: ${admin.email}`);
      console.log(`   Created At: ${admin.createdAt}`);
      console.log(`   Updated At: ${admin.updatedAt}`);
      console.log(`   Email Verified: ${admin.isEmailVerified}`);
      console.log(`   ID: ${admin._id}`);
      
      // Check for suspicious patterns
      const createdDate = new Date(admin.createdAt);
      const now = new Date();
      const daysDiff = Math.floor((now - createdDate) / (1000 * 60 * 60 * 24));
      
      console.log(`   Account Age: ${daysDiff} days old`);
      
      // Flag suspicious characteristics
      if (admin.email && admin.email.includes('russian') || admin.email.includes('.ru')) {
        console.log('   ⚠️  WARNING: Email contains Russian indicators');
      }
      if (admin.name && (admin.name.toLowerCase().includes('hack') || admin.name.toLowerCase().includes('admin') || admin.name.toLowerCase().includes('root'))) {
        console.log('   ⚠️  WARNING: Suspicious name pattern');
      }
      if (daysDiff < 7) {
        console.log('   ⚠️  WARNING: Recently created admin account');
      }
    });
    
    // Check for any accounts created in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentUsers = await User.find({ 
      createdAt: { $gte: thirtyDaysAgo } 
    }).sort({ createdAt: -1 });
    
    console.log('\n=== RECENTLY CREATED ACCOUNTS (LAST 30 DAYS) ===');
    recentUsers.forEach((user, index) => {
      console.log(`\n${index + 1}. ${user.name} (${user.role})`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Created: ${user.createdAt}`);
      console.log(`   Verified: ${user.isEmailVerified}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error during investigation:', error.message);
    process.exit(1);
  }
};

investigateAdmins();
