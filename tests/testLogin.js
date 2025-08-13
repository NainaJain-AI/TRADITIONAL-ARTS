const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const testLogin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
    
    // Test with admin user
    console.log('\n🔍 Testing admin@test.com...');
    const user = await User.findOne({ email: 'admin@test.com' });
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log('👤 User found:', user.name, user.email, user.role);
    console.log('🔒 User has password:', !!user.password);
    console.log('📧 Email verified:', user.isEmailVerified);
    console.log('🔐 Password hash (first 50 chars):', user.password?.substring(0, 50));
    
    // Test different possible passwords
    const possiblePasswords = [
      'admin123',       // From createAdmin.js
      'artist123',      // From createAdmin.js
      'password',
      'testpassword',
      'Admin123!',
      '123456789012',  // 12 char minimum
      'testPassword123',
      'admin@test.com',
      'kalasangam',
      'traditional',
      'admin123456789',  // admin123 + 456789 to meet 12 char requirement
      'artist123456789'  // artist123 + 456789 to meet 12 char requirement
    ];
    
    console.log('\n🔑 Testing possible passwords...');
    let foundPassword = false;
    
    for (const pwd of possiblePasswords) {
      try {
        const isMatch = await user.comparePassword(pwd);
        console.log(`Password "${pwd}": ${isMatch ? '✅ MATCH!' : '❌ No match'}`);
        if (isMatch) {
          console.log(`\n🎉 SUCCESS! The password for admin@test.com is: "${pwd}"`);
          foundPassword = true;
          break;
        }
      } catch (error) {
        console.log(`Password "${pwd}": ❌ ERROR - ${error.message}`);
      }
    }
    
    if (!foundPassword) {
      console.log('\n❌ No matching password found from common options');
      console.log('💡 The password might be something else or the hash might be corrupted');
    }
    
    // Test with artist user too
    console.log('\n' + '='.repeat(60));
    console.log('🔍 Testing artist@test.com...');
    const artist = await User.findOne({ email: 'artist@test.com' });
    if (artist) {
      console.log('👤 Artist found:', artist.name, artist.email, artist.role);
      console.log('🔒 Artist has password:', !!artist.password);
      
      for (const pwd of possiblePasswords) {
        try {
          const isMatch = await artist.comparePassword(pwd);
          console.log(`Password "${pwd}": ${isMatch ? '✅ MATCH!' : '❌ No match'}`);
          if (isMatch) {
            console.log(`\n🎉 SUCCESS! The password for artist@test.com is: "${pwd}"`);
            break;
          }
        } catch (error) {
          console.log(`Password "${pwd}": ❌ ERROR - ${error.message}`);
        }
      }
    }
    
    mongoose.connection.close();
    console.log('\n✅ Test completed');
  } catch (error) {
    console.error('💥 Error:', error.message);
    mongoose.connection.close();
    process.exit(1);
  }
};

testLogin();
