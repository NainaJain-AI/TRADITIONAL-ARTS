const fs = require('fs');
const path = require('path');
const https = require('https');

// Function to get IP geolocation
function getIPGeolocation(ip) {
  return new Promise((resolve) => {
    if (!ip || ip === 'localhost' || ip === '127.0.0.1' || ip === '::1') {
      resolve({
        error: 'Local IP address - no geolocation available',
        ip: ip
      });
      return;
    }

    // Use a free IP geolocation API
    const url = `https://ipapi.co/${ip}/json/`;
    
    https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve({
            ip: ip,
            country: result.country_name || 'Unknown',
            region: result.region || 'Unknown',
            city: result.city || 'Unknown',
            latitude: result.latitude || 'Unknown',
            longitude: result.longitude || 'Unknown',
            timezone: result.timezone || 'Unknown',
            isp: result.org || 'Unknown',
            error: result.error ? result.reason : null
          });
        } catch (e) {
          resolve({
            error: 'Failed to parse geolocation data',
            ip: ip
          });
        }
      });
    }).on('error', (err) => {
      resolve({
        error: 'Failed to fetch geolocation: ' + err.message,
        ip: ip
      });
    });
  });
}

// Function to analyze server logs
async function analyzeServerLogs() {
  console.log('🔍 STEP-BY-STEP IP LOCATION ANALYSIS');
  console.log('=====================================\n');
  
  // Step 1: Check current server logs
  console.log('STEP 1: Checking existing server logs...');
  
  const serverLogPath = path.join(__dirname, 'server.log');
  
  if (fs.existsSync(serverLogPath)) {
    const logContent = fs.readFileSync(serverLogPath, 'utf8');
    console.log('✅ Found server.log');
    console.log('Content:');
    console.log(logContent);
    
    // Look for IP patterns in logs
    const ipPattern = /(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/g;
    const ips = logContent.match(ipPattern);
    
    if (ips && ips.length > 0) {
      console.log(`\n📍 Found ${ips.length} IP address(es) in logs:`);
      const uniqueIps = [...new Set(ips)];
      
      for (const ip of uniqueIps) {
        console.log(`\nAnalyzing IP: ${ip}`);
        const geoData = await getIPGeolocation(ip);
        
        if (geoData.error) {
          console.log(`❌ ${geoData.error}`);
        } else {
          console.log(`🌍 Location: ${geoData.city}, ${geoData.region}, ${geoData.country}`);
          console.log(`🏢 ISP: ${geoData.isp}`);
          console.log(`⏰ Timezone: ${geoData.timezone}`);
          console.log(`📍 Coordinates: ${geoData.latitude}, ${geoData.longitude}`);
        }
      }
    } else {
      console.log('❌ No IP addresses found in server logs');
    }
  } else {
    console.log('❌ No server.log file found');
  }
  
  // Step 2: Manual IP analysis
  console.log('\n\nSTEP 2: Manual IP Analysis Instructions');
  console.log('=========================================');
  
  console.log(`
To find the hacker's IP address and location, you need to:

1. 🔍 CHECK WEB SERVER ACCESS LOGS:
   Look for these log files on your server:
   - Windows IIS: C:\\inetpub\\logs\\LogFiles\\W3SVC1\\
   - Apache: /var/log/apache2/access.log
   - Nginx: /var/log/nginx/access.log
   - Node.js apps usually don't create access logs by default

2. 🕐 FIND LOGS FOR THE BREACH TIME:
   Look for entries around: 2025-08-11 18:51:43 UTC
   (That's 12:21:43 AM IST on August 12, 2025)

3. 📝 SEARCH FOR THESE ENDPOINTS:
   - POST /api/auth/register
   - POST /api/users/create
   - Any profile creation endpoints
   
4. 🔍 LOG ENTRY EXAMPLE:
   You're looking for entries like:
   192.168.1.100 - - [11/Aug/2025:18:51:43 +0000] "POST /api/auth/register HTTP/1.1" 200 1234

5. 🌍 GET IP LOCATION:
   Once you find the IP, use these steps:`);
  
  // Step 3: Provide manual IP lookup
  console.log('\n\nSTEP 3: Manual IP Geolocation Lookup');
  console.log('====================================');
  
  console.log(`
If you find an IP address, enter it below and I'll help you geolocate it.

Example suspicious IPs to check:
- Any Russian IP ranges: 5.*, 37.*, 46.*, 77.*, 78.*, 79.*, 80.*, 81.*, 82.*, 83.*, 84.*, 85.*, 86.*, 87.*, 88.*, 89.*, 90.*, 91.*, 92.*, 93.*, 94.*, 95.*
- VPN/Proxy services
- Tor exit nodes
  `);
  
  // Test with some sample IPs to show functionality
  console.log('\n📍 TESTING GEOLOCATION SERVICE:');
  const testIPs = ['8.8.8.8', '1.1.1.1']; // Google DNS and Cloudflare DNS for testing
  
  for (const testIP of testIPs) {
    console.log(`\nTesting with ${testIP}:`);
    const geoData = await getIPGeolocation(testIP);
    
    if (geoData.error) {
      console.log(`❌ ${geoData.error}`);
    } else {
      console.log(`🌍 ${geoData.city}, ${geoData.region}, ${geoData.country}`);
      console.log(`🏢 ISP: ${geoData.isp}`);
    }
  }
}

// Run the analysis
analyzeServerLogs().catch(console.error);
