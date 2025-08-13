#!/usr/bin/env node

const https = require('https');

console.log('🔍 Testing MongoDB connection fix...\n');

// Test backend health endpoint
function testEndpoint(url, description) {
  return new Promise((resolve, reject) => {
    const request = https.get(url, (response) => {
      let data = '';
      
      response.on('data', (chunk) => {
        data += chunk;
      });
      
      response.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          console.log(`✅ ${description}:`);
          console.log(`   Status: ${response.statusCode}`);
          console.log(`   Response:`, JSON.stringify(jsonData, null, 2));
          resolve(jsonData);
        } catch (error) {
          console.log(`❌ ${description}: Invalid JSON response`);
          console.log(`   Raw response: ${data}`);
          reject(error);
        }
      });
    });
    
    request.on('error', (error) => {
      console.log(`❌ ${description}: ${error.message}`);
      reject(error);
    });
    
    request.setTimeout(10000, () => {
      console.log(`⏰ ${description}: Request timeout`);
      request.destroy();
      reject(new Error('Timeout'));
    });
  });
}

async function runTests() {
  try {
    // Test 1: Backend health check
    await testEndpoint('https://kalasangam.onrender.com/api/health', 'Backend Health Check');
    console.log('');
    
    // Test 2: Backend events API (requires database)
    await testEndpoint('https://kalasangam.onrender.com/api/events', 'Events API (Database Required)');
    console.log('');
    
    // Test 3: Root endpoint
    await testEndpoint('https://kalasangam.onrender.com/', 'Root Endpoint');
    console.log('');
    
    console.log('🎉 All tests completed! Check the database status in the health check.');
    console.log('👀 If database shows "connected", the MongoDB fix was successful!');
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
}

runTests();
