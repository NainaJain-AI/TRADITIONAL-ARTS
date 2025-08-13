#!/usr/bin/env node

// Test script to help debug admin login issues
const https = require('https');
const http = require('http');

async function testAdminLogin() {
  console.log('🔍 Testing Admin Login Functionality\n');
  
  const testCredentials = {
    email: 'admin@test.com',
    password: 'admin123'
  };

  // Test local backend
  console.log('1. Testing local backend (http://localhost:5050)...');
  try {
    const localResult = await makeRequest('http://localhost:5050/api/auth/admin-login', testCredentials);
    console.log('✅ Local backend working:', localResult.success ? 'SUCCESS' : 'FAILED');
    if (localResult.success) {
      console.log('   User:', localResult.data.user.name, '(', localResult.data.user.role, ')');
    } else {
      console.log('   Error:', localResult.error);
    }
  } catch (error) {
    console.log('❌ Local backend failed:', error.message);
  }

  console.log('\n2. Testing production backend (https://kalasangam.onrender.com)...');
  try {
    const prodResult = await makeRequest('https://kalasangam.onrender.com/api/auth/admin-login', testCredentials);
    console.log('✅ Production backend working:', prodResult.success ? 'SUCCESS' : 'FAILED');
    if (prodResult.success) {
      console.log('   User:', prodResult.data.user.name, '(', prodResult.data.user.role, ')');
    } else {
      console.log('   Error:', prodResult.error);
    }
  } catch (error) {
    console.log('❌ Production backend failed:', error.message);
  }

  console.log('\n3. Environment check...');
  console.log('   NODE_ENV:', process.env.NODE_ENV || 'not set');
  console.log('   VITE_API_URL would be:', process.env.VITE_API_URL || 'https://kalasangam.onrender.com (default)');

  console.log('\n📋 Troubleshooting tips:');
  console.log('   - Make sure your server is running on port 5050');
  console.log('   - Check that the .env file has VITE_API_URL=http://localhost:5050');
  console.log('   - Try the admin credentials: admin@test.com / admin123');
  console.log('   - Check browser console for detailed error logs');
}

function makeRequest(url, data) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https');
    const requestModule = isHttps ? https : http;
    const urlObj = new URL(url);
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000
    };

    const req = requestModule.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(responseData);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ success: true, data: jsonData });
          } else {
            resolve({ success: false, error: jsonData.message || responseData, status: res.statusCode });
          }
        } catch (parseError) {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ success: true, data: responseData });
          } else {
            resolve({ success: false, error: responseData, status: res.statusCode });
          }
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.write(JSON.stringify(data));
    req.end();
  });
}

// Run the test
testAdminLogin().catch(console.error);
