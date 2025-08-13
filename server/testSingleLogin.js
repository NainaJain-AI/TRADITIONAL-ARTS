const axios = require('axios');

const BASE_URL = 'http://localhost:5050/api/auth';

async function testSingleLogin() {
  console.log('🧪 Testing Single User Login (to avoid rate limiting)...\n');
  
  // Test just one user to verify the password fix worked
  const testUser = {
    email: 'honey123456789@example.com',
    password: 'testPassword123456',
    name: 'Test User'
  };

  console.log('🔧 First, let\'s create a brand new test user to avoid rate limits...');
  
  try {
    // Register a new user
    const signupResponse = await axios.post(`${BASE_URL}/register`, {
      name: testUser.name,
      email: testUser.email,
      password: testUser.password,
      role: 'Artist'
    });
    
    console.log('✅ New user registered successfully!');
    console.log('🎫 Registration token received:', signupResponse.data.token ? '✅ Yes' : '❌ No');
    console.log('👤 User data:', signupResponse.data.user);
    
    // Now test login with the same user
    console.log('\n🔐 Now testing login with the newly created user...');
    
    // Wait a moment to avoid any timing issues
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const loginResponse = await axios.post(`${BASE_URL}/login`, {
      email: testUser.email,
      password: testUser.password
    });
    
    console.log('✅ Login successful!');
    console.log('🎫 Login token received:', loginResponse.data.token ? '✅ Yes' : '❌ No');
    console.log('👤 Login user data:', loginResponse.data.user);
    
    console.log('\n🎉 BOTH REGISTRATION AND LOGIN ARE WORKING!');
    
  } catch (error) {
    console.log('❌ Test failed:', error.response?.data?.message || error.message);
    
    if (error.response?.status === 429) {
      console.log('\n⏰ Rate limiting is still active. Let\'s test an existing user with a direct database check...');
      await testExistingUserDirectly();
    }
  }
}

async function testExistingUserDirectly() {
  console.log('\n🔍 Testing existing user by direct password verification...');
  
  // We can test the password update worked by trying a few existing users
  const existingUsers = [
    { email: 'honey@example.com', password: 'honey123456789', name: 'honey' },
    { email: 'dimple@example.com', password: 'dimple123456789', name: 'dimple' },
  ];
  
  // Since we can't test via API due to rate limits, let's verify the database directly
  const mongoose = require('mongoose');
  const User = require('./models/User');
  require('dotenv').config();
  
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    for (const testUser of existingUsers) {
      console.log(`🔐 Testing password for ${testUser.name}...`);
      
      // Find a user with this pattern (since exact email might not exist)
      const user = await User.findOne({ 
        $or: [
          { email: { $regex: testUser.name, $options: 'i' } },
          { name: { $regex: testUser.name, $options: 'i' } }
        ]
      });
      
      if (user) {
        // Test the password pattern: [name]123456789
        const expectedPassword = `${user.name.toLowerCase().replace(/\s+/g, '')}123456789`;
        const isMatch = await user.comparePassword(expectedPassword);
        console.log(`   User: ${user.name} (${user.email})`);
        console.log(`   Expected password: ${expectedPassword}`);
        console.log(`   Password test: ${isMatch ? '✅ SUCCESS' : '❌ FAILED'}`);
        
        if (isMatch) {
          console.log(`   🎉 This user can login with: ${expectedPassword}`);
        }
      } else {
        console.log(`   ❌ User ${testUser.name} not found in database`);
      }
    }
    
    mongoose.connection.close();
    
  } catch (error) {
    console.log('❌ Database test failed:', error.message);
    mongoose.connection.close();
  }
}

// Check server status first
async function checkServer() {
  try {
    const response = await axios.get('http://localhost:5050');
    console.log('✅ Server is running\n');
    return true;
  } catch (error) {
    console.log('❌ Server is not running. Please start the server first with: npm start');
    return false;
  }
}

async function main() {
  const serverRunning = await checkServer();
  if (serverRunning) {
    await testSingleLogin();
  }
}

main();
