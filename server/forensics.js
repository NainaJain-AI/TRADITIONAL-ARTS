const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const forensicAnalysis = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/kalasangam');
    console.log('🕵️ Starting Forensic Analysis');
    
    const db = mongoose.connection.db;
    
    // 1. Get detailed info on the malicious account
    console.log('\n=== MALICIOUS ACCOUNT FORENSICS ===');
    const artistProfilesCollection = db.collection('artistprofiles');
    
    const maliciousProfile = await artistProfilesCollection.findOne({
      name: 'russian_hacker'
    });
    
    if (maliciousProfile) {
      console.log('🚨 MALICIOUS ACCOUNT FOUND:');
      console.log('Full Document:', JSON.stringify(maliciousProfile, null, 2));
      
      // Extract timestamp from ObjectId
      const objectId = maliciousProfile._id;
      const timestamp = objectId.getTimestamp();
      
      console.log('\n⏰ EXACT CREATION TIME:');
      console.log(`MongoDB ObjectId: ${objectId}`);
      console.log(`Exact Timestamp: ${timestamp.toISOString()}`);
      console.log(`India Standard Time: ${timestamp.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`);
      console.log(`Unix Timestamp: ${timestamp.getTime()}`);
      
      // Check if there are any IP-related fields
      const ipFields = ['ip', 'ipAddress', 'clientIp', 'remoteIp', 'createdFrom', 'location', 'metadata'];
      console.log('\n🌐 IP ADDRESS ANALYSIS:');
      
      let ipFound = false;
      ipFields.forEach(field => {
        if (maliciousProfile[field]) {
          console.log(`${field}: ${maliciousProfile[field]}`);
          ipFound = true;
        }
      });
      
      if (!ipFound) {
        console.log('❌ No IP address information found in the profile document');
      }
      
    } else {
      console.log('❌ Malicious profile not found');
    }
    
    // 2. Check server logs or any audit collections
    console.log('\n=== CHECKING FOR AUDIT LOGS ===');
    const collections = await db.listCollections().toArray();
    
    const auditCollections = collections.filter(c => 
      c.name.toLowerCase().includes('log') || 
      c.name.toLowerCase().includes('audit') || 
      c.name.toLowerCase().includes('session') ||
      c.name.toLowerCase().includes('access')
    );
    
    if (auditCollections.length > 0) {
      console.log('Found potential audit collections:');
      for (const collection of auditCollections) {
        console.log(`\n--- ${collection.name} ---`);
        const auditCollection = db.collection(collection.name);
        const count = await auditCollection.countDocuments();
        console.log(`Documents: ${count}`);
        
        if (count > 0) {
          // Look for entries around the time of the breach
          const breachTime = new Date('2025-08-12T00:21:43+05:30');
          const timeWindow = 30 * 60 * 1000; // 30 minutes
          
          const suspiciousLogs = await auditCollection.find({
            $or: [
              { timestamp: { $gte: new Date(breachTime.getTime() - timeWindow), $lte: new Date(breachTime.getTime() + timeWindow) } },
              { createdAt: { $gte: new Date(breachTime.getTime() - timeWindow), $lte: new Date(breachTime.getTime() + timeWindow) } },
              { time: { $gte: new Date(breachTime.getTime() - timeWindow), $lte: new Date(breachTime.getTime() + timeWindow) } }
            ]
          }).toArray();
          
          if (suspiciousLogs.length > 0) {
            console.log(`🚨 Found ${suspiciousLogs.length} log entries around breach time:`);
            suspiciousLogs.forEach((log, index) => {
              console.log(`\n${index + 1}.`, JSON.stringify(log, null, 2));
            });
          }
        }
      }
    } else {
      console.log('❌ No audit/log collections found');
    }
    
    // 3. Check all profiles created around the same time
    console.log('\n=== PROFILES CREATED AROUND BREACH TIME ===');
    const breachTime = new Date('2025-08-12T00:21:43+05:30');
    const timeWindow = 60 * 60 * 1000; // 1 hour window
    
    const suspiciousProfiles = await artistProfilesCollection.find({
      _id: {
        $gte: new mongoose.Types.ObjectId(Math.floor((breachTime.getTime() - timeWindow) / 1000).toString(16) + "0000000000000000"),
        $lte: new mongoose.Types.ObjectId(Math.floor((breachTime.getTime() + timeWindow) / 1000).toString(16) + "0000000000000000")
      }
    }).toArray();
    
    console.log(`Found ${suspiciousProfiles.length} profiles created within 1 hour of breach:`);
    suspiciousProfiles.forEach((profile, index) => {
      const timestamp = profile._id.getTimestamp();
      console.log(`${index + 1}. ${profile.name} (${profile.email}) - ${timestamp.toISOString()}`);
    });
    
    // 4. Check User collection for any related accounts
    console.log('\n=== CHECKING USER ACCOUNTS FOR RELATED ACTIVITIES ===');
    const suspiciousUsers = await User.find({
      $or: [
        { email: /hack/i },
        { email: /russia/i },
        { email: /.ru$/ },
        { name: /hack/i },
        { name: /russia/i }
      ]
    });
    
    if (suspiciousUsers.length > 0) {
      console.log('🚨 Found suspicious user accounts:');
      suspiciousUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name} (${user.email}) - Created: ${user.createdAt}`);
      });
    }
    
    // 5. Summary
    console.log('\n=== FORENSIC SUMMARY ===');
    if (maliciousProfile) {
      const exactTime = maliciousProfile._id.getTimestamp();
      console.log(`🚨 BREACH DETAILS:`);
      console.log(`   Account: russian_hacker`);
      console.log(`   Email: hacked@hacker.com`);
      console.log(`   Exact Time: ${exactTime.toISOString()}`);
      console.log(`   IST Time: ${exactTime.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`);
      console.log(`   Unix Timestamp: ${exactTime.getTime()}`);
      console.log(`   ObjectId: ${maliciousProfile._id}`);
      console.log(`   IP Address: ${ipFound ? 'Found in document' : 'Not recorded in profile'}`);
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Forensic analysis error:', error.message);
    process.exit(1);
  }
};

forensicAnalysis();
