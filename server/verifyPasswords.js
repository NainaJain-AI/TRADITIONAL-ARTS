require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function verifyPasswords() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
    
    const users = await User.find({}).limit(5);
    console.log('\n🔐 Verifying password updates for first 5 users:\n');
    
    for (const user of users) {
      const expectedPassword = user.name.toLowerCase().replace(/\s+/g, '') + '123456789';
      const isMatch = await user.comparePassword(expectedPassword);
      console.log(`${user.name} (${user.email})`);
      console.log(`   Expected password: ${expectedPassword}`);
      console.log(`   Password test: ${isMatch ? '✅ SUCCESS' : '❌ FAILED'}`);
      console.log('');
    }
    
    mongoose.connection.close();
    console.log('✅ Verification complete');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    mongoose.connection.close();
  }
}

verifyPasswords();
