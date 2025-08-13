const axios = require('axios');

const BASE_URL = 'http://localhost:5050/api/auth';

// Sample of users to test (first 10 users + some specific ones)
const testUsers = [
  { email: 'admin@test.com', password: 'testadmin123456789', name: 'Test Admin', role: 'Admin' },
  { email: 'artist@test.com', password: 'testartist123456789', name: 'Test Artist', role: 'Artist' },
  { email: 'honeyreorganizer@gmail.com', password: 'nainarameshjain123456789', name: 'Naina Ramesh Jain', role: 'Artist' },
  { email: 'vaishalidak0901@gmail.com', password: 'vaishalidak123456789', name: 'Vaishali Dak', role: 'Artist' },
  { email: 'priya.sharma@artistmail.com', password: 'priyasharma123456789', name: 'Priya Sharma', role: 'Artist' },
  { email: 'u24ai024@aid.svnit.ac.in', password: 'honey123456789', name: 'honey', role: 'Artist' },
  { email: 'dimplesharma@kalasangam.com', password: 'dimple123456789', name: 'dimple', role: 'Artist' },
  { email: 'sunilj2911@gmail.com', password: 'sunil123456789', name: 'sunil', role: 'Artist' },
  { email: 'u24ch038@ched.svnit.ac.in', password: 'ayushjain123456789', name: 'Ayush Jain', role: 'Artist' },
  { email: 'srivastavaojas454@gmail.com', password: 'ojassrivastava123456789', name: 'Ojas Srivastava', role: 'Artist' }
];

async function testMultipleLogins() {
  console.log('🧪 Testing Multiple User Logins...\n');
  console.log(`📊 Testing ${testUsers.length} user accounts\n`);

  let successCount = 0;
  let failCount = 0;
  const results = [];

  for (let i = 0; i < testUsers.length; i++) {
    const user = testUsers[i];
    console.log(`${i + 1}/${testUsers.length} Testing: ${user.name} (${user.email})`);
    
    try {
      const loginResponse = await axios.post(`${BASE_URL}/login`, {
        email: user.email,
        password: user.password
      });
      
      if (loginResponse.data.token && loginResponse.data.user) {
        console.log(`   ✅ SUCCESS - Token received, Role: ${loginResponse.data.user.role}`);
        successCount++;
        results.push({
          user: user.name,
          email: user.email,
          status: 'SUCCESS',
          role: loginResponse.data.user.role,
          tokenReceived: true
        });
      } else {
        console.log(`   ⚠️  LOGIN OK but missing token/user data`);
        failCount++;
        results.push({
          user: user.name,
          email: user.email,
          status: 'PARTIAL',
          issue: 'Missing token or user data'
        });
      }
      
    } catch (error) {
      console.log(`   ❌ FAILED - ${error.response?.data?.message || error.message}`);
      failCount++;
      results.push({
        user: user.name,
        email: user.email,
        status: 'FAILED',
        error: error.response?.data?.message || error.message
      });
    }
    
    // Small delay to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📋 SUMMARY REPORT');
  console.log('='.repeat(60));
  console.log(`✅ Successful logins: ${successCount}/${testUsers.length}`);
  console.log(`❌ Failed logins: ${failCount}/${testUsers.length}`);
  console.log(`📊 Success rate: ${((successCount/testUsers.length) * 100).toFixed(1)}%`);
  
  if (failCount > 0) {
    console.log('\n❌ FAILED LOGINS:');
    results.filter(r => r.status === 'FAILED').forEach(result => {
      console.log(`   • ${result.user} (${result.email}): ${result.error}`);
    });
  }
  
  if (successCount === testUsers.length) {
    console.log('\n🎉 ALL USERS CAN LOGIN SUCCESSFULLY!');
    console.log('🔑 All user account credentials are working properly.');
  } else {
    console.log(`\n⚠️  ${failCount} users still have login issues that need to be resolved.`);
  }
  
  // Test a sample admin login too
  console.log('\n' + '='.repeat(60));
  console.log('🔐 Testing Admin-Specific Login...');
  
  try {
    const adminLogin = await axios.post(`${BASE_URL}/admin-login`, {
      email: 'admin@test.com',
      password: 'testadmin123456789'
    });
    console.log('✅ Admin login endpoint working correctly');
  } catch (error) {
    console.log('❌ Admin login endpoint failed:', error.response?.data?.message || error.message);
  }
  
  console.log('\n✅ Testing completed!');
}

// Check if server is running first
async function checkServer() {
  try {
    const response = await axios.get('http://localhost:5050');
    console.log('✅ Server is running');
    return true;
  } catch (error) {
    console.log('❌ Server is not running. Please start the server first with: npm start');
    return false;
  }
}

async function main() {
  const serverRunning = await checkServer();
  if (serverRunning) {
    await testMultipleLogins();
  }
}

main();
