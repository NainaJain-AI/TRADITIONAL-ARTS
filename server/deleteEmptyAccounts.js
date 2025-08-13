const mongoose = require('mongoose');
const User = require('./models/User');
const Artwork = require('./models/Artwork');
const ArtistProfile = require('./models/Artist');
require('dotenv').config();

const deleteEmptyAccounts = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
    
    // Get all users
    const allUsers = await User.find({});
    console.log(`\n📊 Found ${allUsers.length} total users`);
    
    // Protected accounts that should never be deleted
    const protectedUsers = ['admin@test.com', 'artist@test.com'];
    
    // Find users without artworks
    const usersToDelete = [];
    
    console.log('\n🔍 Finding users without artworks...\n');
    
    for (const user of allUsers) {
      // Skip protected accounts
      if (protectedUsers.includes(user.email)) {
        console.log(`🔐 Protected: ${user.name} (${user.email})`);
        continue;
      }
      
      // Count artworks for this user
      const artworkCount = await Artwork.countDocuments({ userId: user._id });
      
      if (artworkCount === 0) {
        usersToDelete.push(user);
        console.log(`❌ To Delete: ${user.name} (${user.email})`);
      } else {
        console.log(`✅ Keep: ${user.name} (${user.email}) - ${artworkCount} artworks`);
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log(`🗑️  DELETING ${usersToDelete.length} EMPTY ACCOUNTS`);
    console.log('='.repeat(60));
    
    if (usersToDelete.length === 0) {
      console.log('✅ No empty accounts found to delete!');
      mongoose.connection.close();
      return;
    }
    
    let deletedCount = 0;
    const deletedAccounts = [];
    
    for (const user of usersToDelete) {
      try {
        // Remove from ArtistProfile first (if exists)
        await ArtistProfile.deleteMany({ userId: user._id });
        
        // Remove the user
        await User.deleteOne({ _id: user._id });
        
        deletedAccounts.push({
          name: user.name,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt
        });
        
        console.log(`✅ Deleted: ${user.name} (${user.email})`);
        deletedCount++;
        
      } catch (error) {
        console.log(`❌ Error deleting ${user.name}: ${error.message}`);
      }
    }
    
    // Create deletion log
    const fs = require('fs');
    const deletionLog = {
      timestamp: new Date().toISOString(),
      totalUsersBeforeDeletion: allUsers.length,
      usersDeleted: deletedCount,
      remainingUsers: allUsers.length - deletedCount,
      deletedAccounts: deletedAccounts
    };
    
    fs.writeFileSync('deletion_log.json', JSON.stringify(deletionLog, null, 2));
    
    console.log('\n🎉 CLEANUP COMPLETED!');
    console.log(`✅ Successfully deleted: ${deletedCount} empty accounts`);
    console.log(`📊 Total users before: ${allUsers.length}`);
    console.log(`📊 Total users after: ${allUsers.length - deletedCount}`);
    console.log(`📝 Deletion log saved to: deletion_log.json`);
    
    // Show remaining users
    console.log('\n👥 REMAINING ACTIVE USERS:');
    const remainingUsers = await User.find({});
    for (const user of remainingUsers) {
      const artworkCount = await Artwork.countDocuments({ userId: user._id });
      const status = protectedUsers.includes(user.email) ? '(Protected)' : `(${artworkCount} artworks)`;
      console.log(`   • ${user.name} (${user.email}) ${status}`);
    }
    
    mongoose.connection.close();
    
  } catch (error) {
    console.error('💥 Error:', error.message);
    mongoose.connection.close();
  }
};

deleteEmptyAccounts();
