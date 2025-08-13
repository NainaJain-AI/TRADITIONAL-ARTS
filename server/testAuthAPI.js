const axios = require('axios');

const BASE_URL = 'http://localhost:5050/api/auth';

async function testAuthAPI() {
  console.log('🧪 Testing Authentication API...\n');

  try {
    // Test 1: Login with existing admin user
    console.log('1️⃣ Testing admin login...');
    try {
      const adminLoginResponse = await axios.post(`${BASE_URL}/login`, {
        email: 'admin@test.com',
        password: 'admin123456789'
      });
      
      console.log('✅ Admin login successful!');
      console.log('🎫 Token received:', adminLoginResponse.data.token ? '✅ Yes' : '❌ No');
      console.log('👤 User data:', adminLoginResponse.data.user);
    } catch (error) {
      console.log('❌ Admin login failed:', error.response?.data?.message || error.message);
    }

    console.log('\n' + '='.repeat(50));

    // Test 2: Login with existing artist user
    console.log('2️⃣ Testing artist login...');
    try {
      const artistLoginResponse = await axios.post(`${BASE_URL}/login`, {
        email: 'artist@test.com',
        password: 'artist123456789'
      });
      
      console.log('✅ Artist login successful!');
      console.log('🎫 Token received:', artistLoginResponse.data.token ? '✅ Yes' : '❌ No');
      console.log('👤 User data:', artistLoginResponse.data.user);
    } catch (error) {
      console.log('❌ Artist login failed:', error.response?.data?.message || error.message);
    }

    console.log('\n' + '='.repeat(50));

    // Test 3: Test signup with new user
    console.log('3️⃣ Testing user registration...');
    const testEmail = `test${Date.now()}@example.com`;
    try {
      const signupResponse = await axios.post(`${BASE_URL}/register`, {
        name: 'Test User',
        email: testEmail,
        password: 'newPassword123456',
        role: 'Artist'
      });
      
      console.log('✅ User registration successful!');
      console.log('🎫 Token received:', signupResponse.data.token ? '✅ Yes' : '❌ No');
      console.log('👤 User data:', signupResponse.data.user);
      console.log('📧 Email verification required:', !signupResponse.data.user.isEmailVerified);
    } catch (error) {
      console.log('❌ User registration failed:', error.response?.data?.message || error.message);
    }

    console.log('\n' + '='.repeat(50));

    // Test 4: Test invalid login
    console.log('4️⃣ Testing invalid login...');
    try {
      await axios.post(`${BASE_URL}/login`, {
        email: 'admin@test.com',
        password: 'wrongpassword'
      });
      console.log('❌ This should have failed but didn\'t!');
    } catch (error) {
      console.log('✅ Invalid login correctly rejected:', error.response?.data?.message);
    }

    console.log('\n' + '='.repeat(50));

    // Test 5: Test admin login endpoint
    console.log('5️⃣ Testing admin-specific login...');
    try {
      const adminSpecificLogin = await axios.post(`${BASE_URL}/admin-login`, {
        email: 'admin@test.com',
        password: 'admin123456789'
      });
      
      console.log('✅ Admin-specific login successful!');
      console.log('🎫 Token received:', adminSpecificLogin.data.token ? '✅ Yes' : '❌ No');
      console.log('👤 User role:', adminSpecificLogin.data.user.role);
    } catch (error) {
      console.log('❌ Admin-specific login failed:', error.response?.data?.message || error.message);
    }

    console.log('\n' + '='.repeat(50));

    // Test 6: Test artist trying admin login
    console.log('6️⃣ Testing artist trying admin login (should fail)...');
    try {
      await axios.post(`${BASE_URL}/admin-login`, {
        email: 'artist@test.com',
        password: 'artist123456789'
      });
      console.log('❌ This should have failed but didn\'t!');
    } catch (error) {
      console.log('✅ Artist correctly denied admin access:', error.response?.data?.message);
    }

    console.log('\n🎉 Authentication API testing completed!');

  } catch (error) {
    console.error('💥 Unexpected error during testing:', error.message);
  }
}

// Check if axios is available
try {
  require.resolve('axios');
  testAuthAPI();
} catch (e) {
  console.log('❌ axios not found. Installing axios...');
  console.log('Please run: npm install axios');
  console.log('Then run this script again.');
}
