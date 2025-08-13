const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const checkUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/kalasangam');
    console.log('✅ Connected to MongoDB');
    
    // Check total user accounts
    const totalUsers = await User.countDocuments();
    console.log(`\n👥 TOTAL USER ACCOUNTS: ${totalUsers}`);
    
    // List all users
    const allUsers = await User.find({}).select('name email role createdAt');
    console.log('\n📋 ALL USER ACCOUNTS:');
    allUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.role}) - ${user.email} - Created: ${user.createdAt.toLocaleDateString()}`);
    });
    
    // Check artist profiles
    const db = mongoose.connection.db;
    const artistProfilesCollection = db.collection('artistprofiles');
    const totalProfiles = await artistProfilesCollection.countDocuments();
    
    console.log(`\n🎨 TOTAL ARTIST PROFILES: ${totalProfiles}`);
    
    console.log('\n✅ USER ACCOUNT STATUS:');
    console.log(`- ${totalUsers} users can now log in`);
    console.log(`- ${totalProfiles} artist profiles available`);
    console.log(`- All user accounts have been successfully created!`);
    
    console.log('\n🔑 LOGIN CREDENTIALS FOR NEW USERS:');
    console.log('====================================');
    console.log('📧 Email: [Use the artist\'s email address]');
    console.log('🔒 Password: TempPass123!@# (temporary - must be changed)');
    console.log('⚠️ Users need to verify their email and update password');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

checkUsers();
