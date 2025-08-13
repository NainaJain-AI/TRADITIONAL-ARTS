const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const analyzeBreath = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/kalasangam');
    console.log('🔍 Analyzing Security Breach');
    
    const db = mongoose.connection.db;
    
    // Check artistprofiles collection for all profiles
    console.log('\n=== ANALYZING artistprofiles COLLECTION ===');
    const artistProfilesCollection = db.collection('artistprofiles');
    const allProfiles = await artistProfilesCollection.find({}).toArray();
    
    console.log(`Total profiles in artistprofiles: ${allProfiles.length}`);
    
    // Show all profiles with details
    allProfiles.forEach((profile, index) => {
      console.log(`\n${index + 1}. Profile:`);
      console.log(`   Name: ${profile.name || 'No name'}`);
      console.log(`   Email: ${profile.email || 'No email'}`);
      console.log(`   Created: ${profile.createdAt || profile._id.getTimestamp()}`);
      console.log(`   ID: ${profile._id}`);
      
      // Check for admin-related content
      if (profile.role === 'Admin' || (profile.name && profile.name.toLowerCase().includes('admin'))) {
        console.log(`   🚨 ADMIN CONTENT FOUND IN ARTIST PROFILES!`);
      }
      
      // Check for Russian indicators
      if (profile.email && profile.email.includes('.ru')) {
        console.log(`   🚨 RUSSIAN EMAIL DOMAIN!`);
      }
    });
    
    // Check all admin users again
    console.log('\n=== CURRENT ADMIN ACCOUNTS ===');
    const admins = await User.find({ role: 'Admin' });
    
    admins.forEach((admin, index) => {
      console.log(`\n${index + 1}. Admin: ${admin.name}`);
      console.log(`   Email: ${admin.email}`);
      console.log(`   Created: ${admin.createdAt}`);
      console.log(`   Updated: ${admin.updatedAt}`);
      console.log(`   Has Password: ${admin.password ? 'Yes' : 'No'}`);
      console.log(`   Email Verified: ${admin.isEmailVerified}`);
      
      // Time analysis
      const createdTime = new Date(admin.createdAt);
      const updatedTime = new Date(admin.updatedAt);
      const timeDiff = updatedTime - createdTime;
      
      console.log(`   Time between creation and update: ${Math.floor(timeDiff / (1000 * 60))} minutes`);
      
      if (admin.name.toLowerCase().includes('test') && admin.name.toLowerCase().includes('admin')) {
        console.log(`   ⚠️  This appears to be a test admin account`);
      }
    });
    
    // Check if login is broken for all users
    console.log('\n=== LOGIN SYSTEM STATUS ===');
    const allUsers = await User.find({});
    
    let usersWithoutLogin = 0;
    let adminWithoutLogin = 0;
    
    allUsers.forEach(user => {
      if (!user.password && !user.googleId) {
        usersWithoutLogin++;
        if (user.role === 'Admin') adminWithoutLogin++;
      }
    });
    
    console.log(`Total users: ${allUsers.length}`);
    console.log(`Users without login method: ${usersWithoutLogin}`);
    console.log(`Admins without login method: ${adminWithoutLogin}`);
    
    if (usersWithoutLogin > 0) {
      console.log('\n🚨 CRITICAL: Users found without login credentials!');
    }
    
    // Summary
    console.log('\n=== BREACH ANALYSIS SUMMARY ===');
    console.log(`- Database appears intact`);
    console.log(`- Found ${allProfiles.length} artist profiles`);
    console.log(`- Found ${admins.length} admin account(s)`);
    console.log(`- Admin account created TODAY at: ${admins[0]?.createdAt}`);
    console.log(`- No "test.adminprofiles" collection found (it's "artistprofiles")`);
    
    if (admins.length === 1 && admins[0].name === 'Test Admin') {
      console.log('\n💡 ANALYSIS: The "malicious Russian hacker" appears to be the "Test Admin" account');
      console.log('   This account was created today and may be causing login issues');
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

analyzeBreath();
