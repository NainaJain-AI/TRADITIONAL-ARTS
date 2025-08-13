const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const resetTestPasswords = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
    
    // Update admin password to meet 12-char requirement
    const adminUser = await User.findOne({ email: 'admin@test.com' });
    if (adminUser) {
      console.log('\n📝 Updating admin password...');
      adminUser.password = 'admin123456789'; // 15 characters, meets requirement
      await adminUser.save();
      console.log('✅ Admin password updated to: admin123456789');
    } else {
      console.log('❌ Admin user not found');
    }
    
    // Update artist password to meet 12-char requirement
    const artistUser = await User.findOne({ email: 'artist@test.com' });
    if (artistUser) {
      console.log('\n📝 Updating artist password...');
      artistUser.password = 'artist123456789'; // 16 characters, meets requirement
      await artistUser.save();
      console.log('✅ Artist password updated to: artist123456789');
    } else {
      console.log('❌ Artist user not found');
    }
    
    console.log('\n🎉 Test user passwords have been updated!');
    console.log('\nUpdated Login Credentials:');
    console.log('Admin - Email: admin@test.com, Password: admin123456789');
    console.log('Artist - Email: artist@test.com, Password: artist123456789');
    
    mongoose.connection.close();
  } catch (error) {
    console.error('💥 Error:', error.message);
    mongoose.connection.close();
    process.exit(1);
  }
};

resetTestPasswords();
