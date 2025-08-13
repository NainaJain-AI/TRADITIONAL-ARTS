const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const testLogin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/kalasangam');
    console.log('Connected to MongoDB');
    
    const user = await User.findOne({ email: 'admin@test.com' });
    if (!user) {
      console.log('User not found');
      return;
    }
    
    console.log('User found:', user.name, user.email, user.role);
    console.log('User has password:', !!user.password);
    
    // Test password comparison
    const testPassword = 'admin123';
    const isMatch = await user.comparePassword(testPassword);
    console.log('Password comparison result:', isMatch);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

testLogin();
