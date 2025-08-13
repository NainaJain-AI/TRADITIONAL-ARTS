const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const securityInvestigation = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/kalasangam');
    console.log('🔍 Connected to MongoDB for Security Investigation');
    
    const db = mongoose.connection.db;
    
    // 1. List all collections in the database
    console.log('\n=== DATABASE COLLECTIONS ===');
    const collections = await db.listCollections().toArray();
    collections.forEach((collection, index) => {
      console.log(`${index + 1}. ${collection.name}`);
    });
    
    // 2. Check for test.adminprofiles collection specifically
    console.log('\n=== CHECKING FOR test.adminprofiles COLLECTION ===');
    const adminProfilesExists = collections.find(c => c.name === 'test.adminprofiles');
    if (adminProfilesExists) {
      console.log('⚠️  FOUND: test.adminprofiles collection exists!');
      const adminProfilesCollection = db.collection('test.adminprofiles');
      const adminProfiles = await adminProfilesCollection.find({}).toArray();
      console.log(`Found ${adminProfiles.length} documents in test.adminprofiles:`);
      adminProfiles.forEach((profile, index) => {
        console.log(`\n${index + 1}. Profile:`, JSON.stringify(profile, null, 2));
      });
    } else {
      console.log('❌ test.adminprofiles collection not found');
    }
    
    // 3. Check all collections for suspicious content
    console.log('\n=== SCANNING ALL COLLECTIONS FOR SUSPICIOUS DATA ===');
    for (const collectionInfo of collections) {
      const collection = db.collection(collectionInfo.name);
      const count = await collection.countDocuments();
      console.log(`\n${collectionInfo.name}: ${count} documents`);
      
      // Check for recent documents in each collection
      try {
        const recent = await collection.find({}).sort({_id: -1}).limit(3).toArray();
        if (recent.length > 0) {
          console.log(`  Most recent documents:`);
          recent.forEach((doc, i) => {
            const createdDate = doc.createdAt || doc._id.getTimestamp();
            console.log(`    ${i + 1}. Created: ${createdDate}`);
          });
        }
      } catch (e) {
        // Some collections might not have standard structure
      }
    }
    
    // 4. Detailed admin analysis
    console.log('\n=== COMPREHENSIVE ADMIN ANALYSIS ===');
    const adminUsers = await User.find({ role: 'Admin' });
    
    for (const admin of adminUsers) {
      console.log(`\n--- Admin Account: ${admin.name} ---`);
      console.log(`Email: ${admin.email}`);
      console.log(`ID: ${admin._id}`);
      console.log(`Created: ${admin.createdAt}`);
      console.log(`Updated: ${admin.updatedAt}`);
      console.log(`Email Verified: ${admin.isEmailVerified}`);
      
      // Security flags
      const flags = [];
      if (admin.email && admin.email.includes('.ru')) flags.push('Russian domain');
      if (admin.name && admin.name.toLowerCase().includes('admin')) flags.push('Generic admin name');
      if (admin.isEmailVerified && new Date(admin.createdAt).getTime() === new Date(admin.updatedAt).getTime()) {
        flags.push('Instantly verified');
      }
      
      const ageHours = (new Date() - new Date(admin.createdAt)) / (1000 * 60 * 60);
      if (ageHours < 24) flags.push(`Created ${Math.floor(ageHours)} hours ago`);
      
      if (flags.length > 0) {
        console.log('🚨 SECURITY FLAGS:');
        flags.forEach(flag => console.log(`   - ${flag}`));
      }
    }
    
    // 5. Check for today's admin accounts
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todaysAdmins = await User.find({
      role: 'Admin',
      createdAt: { $gte: today }
    });
    
    if (todaysAdmins.length > 0) {
      console.log('\n🚨 ADMIN ACCOUNTS CREATED TODAY:');
      todaysAdmins.forEach((admin, index) => {
        console.log(`${index + 1}. ${admin.name} (${admin.email}) - ${admin.createdAt}`);
      });
    }
    
    console.log('\n🔍 Investigation Complete');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error during investigation:', error.message);
    process.exit(1);
  }
};

securityInvestigation();
