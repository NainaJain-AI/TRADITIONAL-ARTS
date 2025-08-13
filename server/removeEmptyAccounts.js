const mongoose = require('mongoose');
const User = require('./models/User');
const Artwork = require('./models/Artwork');
const ArtistProfile = require('./models/Artist');
require('dotenv').config();

const removeEmptyAccounts = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
    
    // Get all users
    const allUsers = await User.find({});
    console.log(`\n📊 Found ${allUsers.length} total users`);
    
    // Check each user for artworks
    const usersWithArtworks = [];
    const usersWithoutArtworks = [];
    const protectedUsers = ['admin@test.com', 'artist@test.com']; // Keep test accounts
    
    console.log('\n🔍 Analyzing user accounts...\n');
    
    for (const user of allUsers) {
      // Count artworks for this user
      const artworkCount = await Artwork.countDocuments({ userId: user._id });
      
      if (artworkCount > 0) {
        usersWithArtworks.push({
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          artworkCount
        });
        console.log(`✅ Keep: ${user.name} (${user.email}) - ${artworkCount} artworks`);
      } else {
        // Check if this is a protected account
        if (protectedUsers.includes(user.email)) {
          console.log(`🔐 Keep: ${user.name} (${user.email}) - Protected test account`);
          usersWithArtworks.push({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            artworkCount: 0,
            protected: true
          });
        } else {
          usersWithoutArtworks.push({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            createdAt: user.createdAt
          });
          console.log(`❌ Remove: ${user.name} (${user.email}) - No artworks`);
        }
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📋 SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Users to keep: ${usersWithArtworks.length}`);
    console.log(`❌ Users to remove: ${usersWithoutArtworks.length}`);
    
    if (usersWithoutArtworks.length === 0) {
      console.log('\n🎉 All users have artworks! Nothing to remove.');
      mongoose.connection.close();
      return;
    }
    
    console.log('\n📝 Users that will be REMOVED:');
    usersWithoutArtworks.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email}) - Created: ${user.createdAt?.toDateString() || 'Unknown'}`);
    });
    
    // Ask for confirmation
    console.log('\n⚠️  WARNING: This will permanently delete these user accounts!');
    console.log('🔄 If you want to proceed, uncomment the deletion code below and run again.');
    console.log('\n💾 Creating backup list of accounts to be removed...');
    
    // Create backup file
    const fs = require('fs');
    const backupData = {
      timestamp: new Date().toISOString(),
      totalUsers: allUsers.length,
      usersToKeep: usersWithArtworks.length,
      usersToRemove: usersWithoutArtworks.length,
      removedAccounts: usersWithoutArtworks
    };
    
    fs.writeFileSync('removed_accounts_backup.json', JSON.stringify(backupData, null, 2));
    console.log('✅ Backup saved to: removed_accounts_backup.json');
    
    // *** UNCOMMENT THE LINES BELOW TO ACTUALLY DELETE THE ACCOUNTS ***
    /*
    console.log('\n🗑️  Starting deletion process...');
    
    let deletedCount = 0;
    for (const user of usersWithoutArtworks) {
      try {
        // Remove from ArtistProfile first (if exists)
        await ArtistProfile.deleteMany({ userId: user._id });
        
        // Remove the user
        await User.deleteOne({ _id: user._id });
        
        console.log(`✅ Deleted: ${user.name} (${user.email})`);
        deletedCount++;
      } catch (error) {
        console.log(`❌ Error deleting ${user.name}: ${error.message}`);
      }
    }
    
    console.log(`\n🎉 Successfully deleted ${deletedCount} empty accounts!`);
    console.log(`📊 Remaining users: ${allUsers.length - deletedCount}`);
    */
    
    console.log('\n🚀 TO ACTUALLY DELETE THE ACCOUNTS:');
    console.log('1. Edit this script and uncomment the deletion code');
    console.log('2. Run the script again');
    console.log('3. The backup file will help you restore if needed');
    
    mongoose.connection.close();
    
  } catch (error) {
    console.error('💥 Error:', error.message);
    mongoose.connection.close();
  }
};

removeEmptyAccounts();
