const axios = require('axios');

const BASE_URL = 'http://localhost:5050/api/auth';

async function testAdminLogin() {
  console.log('🔐 Testing Admin Login with Updated Credentials...\n');
  
  const adminCredentials = {
    email: 'admin@test.com',
    password: 'testadmin123456789'
  };
  
  try {
    console.log('📧 Email:', adminCredentials.email);
    console.log('🔑 Password:', adminCredentials.password);
    console.log('\n🚀 Attempting admin login...');
    
    const loginResponse = await axios.post(`${BASE_URL}/login`, adminCredentials);
    
    console.log('✅ Admin login successful!');
    console.log('🎫 Token received:', loginResponse.data.token ? '✅ Yes' : '❌ No');
    console.log('👤 User data:');
    console.log('   - Name:', loginResponse.data.user.name);
    console.log('   - Email:', loginResponse.data.user.email);
    console.log('   - Role:', loginResponse.data.user.role);
    console.log('   - Email Verified:', loginResponse.data.user.isEmailVerified);
    
    // Also test admin-specific login endpoint
    console.log('\n🔐 Testing admin-specific login endpoint...');
    
    const adminLoginResponse = await axios.post(`${BASE_URL}/admin-login`, adminCredentials);
    
    console.log('✅ Admin-specific login also successful!');
    console.log('👔 Admin role confirmed:', adminLoginResponse.data.user.role === 'Admin' ? '✅ Yes' : '❌ No');
    
    console.log('\n🎉 ALL ADMIN LOGIN TESTS PASSED!');
    
  } catch (error) {
    if (error.response?.status === 429) {
      console.log('❌ Still hitting rate limit. Please:');
      console.log('   1. Restart your server to apply the temporary rate limit changes');
      console.log('   2. Wait a few more minutes for the current rate limit to expire');
      console.log('   3. Try again');
    } else {
      console.log('❌ Login failed:', error.response?.data?.message || error.message);
      
      if (error.response?.data?.message === 'Invalid credentials') {
        console.log('\n🔍 Troubleshooting:');
        console.log('   - Double-check the password: testadmin123456789');
        console.log('   - Ensure the server is running');
        console.log('   - Check if the password update script completed successfully');
      }
    }
  }
}

// Check if server is running
async function checkServer() {
  try {
    const response = await axios.get('http://localhost:5050');
    console.log('✅ Server is running');
    return true;
  } catch (error) {
    console.log('❌ Server is not running. Please start it with: npm start');
    return false;
  }
}

async function main() {
  const serverRunning = await checkServer();
  if (serverRunning) {
    await testAdminLogin();
  }
}

main();
