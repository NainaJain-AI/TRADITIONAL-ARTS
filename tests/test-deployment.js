#!/usr/bin/env node

const https = require('https');

const testUrls = [
  'https://kalasangam.onrender.com',
  'https://kalasangam.onrender.com/api/health',
  'https://kala-sangam.onrender.com'
];

function testUrl(url) {
  return new Promise((resolve) => {
    console.log(`\n🔍 Testing: ${url}`);
    
    const req = https.get(url, (res) => {
      console.log(`✅ Status: ${res.statusCode}`);
      console.log(`📋 Headers:`, res.headers);
      
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.headers['content-type'] && res.headers['content-type'].includes('application/json')) {
          try {
            const json = JSON.parse(data);
            console.log(`📄 Response:`, json);
          } catch (e) {
            console.log(`📄 Response (raw):`, data.substring(0, 200) + '...');
          }
        } else {
          console.log(`📄 Response (first 200 chars):`, data.substring(0, 200) + '...');
        }
        resolve();
      });
    });

    req.on('error', (error) => {
      console.log(`❌ Error: ${error.message}`);
      resolve();
    });

    req.setTimeout(10000, () => {
      console.log(`⏰ Timeout: Request took too long`);
      req.destroy();
      resolve();
    });
  });
}

async function runTests() {
  console.log('🚀 Testing deployed services...\n');
  
  for (const url of testUrls) {
    await testUrl(url);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s between requests
  }
  
  console.log('\n✨ Test completed!');
}

runTests();
