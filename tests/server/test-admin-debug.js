const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const testAdminLogin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/kalasangam');
    console.log('🔗 Connected to MongoDB');
    
    // Test the admin user
    const email = 'admin@test.com';
    const password = 'admin123';
    
    console.log('\n🔍 Testing admin login...');
    console.log('Email:', email);
    console.log('Password:', password);
    
    // Find user
    const user = await User.findOne({ email });
    console.log('\n👤 User found:', !!user);
    
    if (user) {
      console.log('User details:');
      console.log('- Name:', user.name);
      console.log('- Email:', user.email);
      console.log('- Role:', user.role);
      console.log('- Email Verified:', user.isEmailVerified);
      
      // Test password
      const isMatch = await user.comparePassword(password);
      console.log('\n🔑 Password match:', isMatch);
      
      if (user.role === 'Admin') {
        console.log('✅ User has Admin role');
      } else {
        console.log('❌ User does NOT have Admin role');
      }
      
      if (isMatch && user.role === 'Admin') {
        console.log('\n🎉 ADMIN LOGIN SHOULD WORK!');
        console.log('Use these credentials:');
        console.log('Email: admin@test.com');
        console.log('Password: admin123');
      } else {
        console.log('\n❌ Admin login will fail');
      }
    } else {
      console.log('❌ Admin user not found');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('💥 Error:', error.message);
    process.exit(1);
  }
};

testAdminLogin();
