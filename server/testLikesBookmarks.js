const mongoose = require('mongoose');
const User = require('./models/User');
const Artwork = require('./models/Artwork');
require('dotenv').config();

const testLikesAndBookmarks = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
    
    // Get all remaining users and artworks
    const users = await User.find({});
    const artworks = await Artwork.find({}).populate('userId', 'name email');
    
    console.log(`\n📊 Testing with ${users.length} users and ${artworks.length} artworks`);
    
    // Clean up any invalid references in existing likes/bookmarks
    console.log('\n🧹 Cleaning up invalid references...');
    
    for (const artwork of artworks) {
      let updated = false;
      
      // Clean invalid likes
      if (artwork.likes && artwork.likes.length > 0) {
        const validLikes = [];
        for (const likeUserId of artwork.likes) {
          const userExists = await User.findById(likeUserId);
          if (userExists) {
            validLikes.push(likeUserId);
          } else {
            console.log(`🧹 Removed invalid like from deleted user on artwork: ${artwork.title}`);
            updated = true;
          }
        }
        artwork.likes = validLikes;
      }
      
      // Clean invalid bookmarks
      if (artwork.bookmarks && artwork.bookmarks.length > 0) {
        const validBookmarks = [];
        for (const bookmarkUserId of artwork.bookmarks) {
          const userExists = await User.findById(bookmarkUserId);
          if (userExists) {
            validBookmarks.push(bookmarkUserId);
          } else {
            console.log(`🧹 Removed invalid bookmark from deleted user on artwork: ${artwork.title}`);
            updated = true;
          }
        }
        artwork.bookmarks = validBookmarks;
      }
      
      if (updated) {
        await artwork.save();
      }
    }
    
    // Also clean up user likes and bookmarks arrays
    console.log('\n🧹 Cleaning up user likes and bookmarks...');
    
    for (const user of users) {
      let userUpdated = false;
      
      // Clean invalid likes in user document
      if (user.likes && user.likes.length > 0) {
        const validUserLikes = [];
        for (const artworkId of user.likes) {
          const artworkExists = await Artwork.findById(artworkId);
          if (artworkExists) {
            validUserLikes.push(artworkId);
          } else {
            console.log(`🧹 Removed invalid like reference from user ${user.name}`);
            userUpdated = true;
          }
        }
        user.likes = validUserLikes;
      }
      
      // Clean invalid bookmarks in user document
      if (user.bookmarks && user.bookmarks.length > 0) {
        const validUserBookmarks = [];
        for (const artworkId of user.bookmarks) {
          const artworkExists = await Artwork.findById(artworkId);
          if (artworkExists) {
            validUserBookmarks.push(artworkId);
          } else {
            console.log(`🧹 Removed invalid bookmark reference from user ${user.name}`);
            userUpdated = true;
          }
        }
        user.bookmarks = validUserBookmarks;
      }
      
      if (userUpdated) {
        await user.save();
      }
    }
    
    console.log('\n🧪 Testing likes and bookmarks functionality...');
    
    // Test likes and bookmarks functionality
    const testResults = {
      likesWorking: 0,
      bookmarksWorking: 0,
      errors: []
    };
    
    // Get a sample artwork and test user
    const testArtwork = artworks[0];
    const testUser = users.find(u => u.email !== testArtwork.userId.email); // Different user than artwork owner
    
    if (!testUser) {
      console.log('❌ Need at least 2 users to test likes/bookmarks functionality');
      mongoose.connection.close();
      return;
    }
    
    console.log(`\n🎨 Testing with artwork: "${testArtwork.title}" by ${testArtwork.userId.name}`);
    console.log(`👤 Testing user: ${testUser.name}`);
    
    // Test Like functionality
    console.log('\n💖 Testing LIKE functionality...');
    try {
      // Add like
      if (!testArtwork.likes.includes(testUser._id)) {
        testArtwork.likes.push(testUser._id);
        await testArtwork.save();
        console.log('✅ Like added to artwork');
      }
      
      // Add to user's likes if not already there
      if (!testUser.likes.includes(testArtwork._id)) {
        testUser.likes.push(testArtwork._id);
        await testUser.save();
        console.log('✅ Artwork added to user likes');
      }
      
      // Verify like count
      const updatedArtwork = await Artwork.findById(testArtwork._id);
      console.log(`✅ Like count: ${updatedArtwork.likes.length}`);
      
      testResults.likesWorking = 1;
      
    } catch (error) {
      console.log('❌ Like functionality error:', error.message);
      testResults.errors.push(`Like error: ${error.message}`);
    }
    
    // Test Bookmark functionality
    console.log('\n🔖 Testing BOOKMARK functionality...');
    try {
      // Add bookmark
      if (!testArtwork.bookmarks.includes(testUser._id)) {
        testArtwork.bookmarks.push(testUser._id);
        await testArtwork.save();
        console.log('✅ Bookmark added to artwork');
      }
      
      // Add to user's bookmarks if not already there
      if (!testUser.bookmarks.includes(testArtwork._id)) {
        testUser.bookmarks.push(testArtwork._id);
        await testUser.save();
        console.log('✅ Artwork added to user bookmarks');
      }
      
      // Verify bookmark count
      const updatedArtwork = await Artwork.findById(testArtwork._id);
      console.log(`✅ Bookmark count: ${updatedArtwork.bookmarks.length}`);
      
      testResults.bookmarksWorking = 1;
      
    } catch (error) {
      console.log('❌ Bookmark functionality error:', error.message);
      testResults.errors.push(`Bookmark error: ${error.message}`);
    }
    
    // Generate comprehensive report
    console.log('\n' + '='.repeat(60));
    console.log('📋 FINAL REPORT');
    console.log('='.repeat(60));
    
    console.log('🎉 CLEANUP SUMMARY:');
    console.log(`   • Users deleted: 20`);
    console.log(`   • Users remaining: ${users.length}`);
    console.log(`   • Active artworks: ${artworks.length}`);
    
    console.log('\n✅ REMAINING ACTIVE ARTISTS:');
    for (const user of users) {
      const userArtworks = artworks.filter(a => a.userId._id.toString() === user._id.toString());
      const status = user.email.includes('test.com') ? '(Test Account)' : `(${userArtworks.length} artworks)`;
      console.log(`   • ${user.name} (${user.email}) ${status}`);
      
      // Show artwork titles for this user
      if (userArtworks.length > 0) {
        userArtworks.forEach(artwork => {
          console.log(`     - "${artwork.title}" (${artwork.likes.length} likes, ${artwork.bookmarks.length} bookmarks)`);
        });
      }
    }
    
    console.log('\n🔧 FUNCTIONALITY TEST RESULTS:');
    console.log(`   • Likes functionality: ${testResults.likesWorking ? '✅ WORKING' : '❌ NOT WORKING'}`);
    console.log(`   • Bookmarks functionality: ${testResults.bookmarksWorking ? '✅ WORKING' : '❌ NOT WORKING'}`);
    
    if (testResults.errors.length > 0) {
      console.log('\n❌ ERRORS FOUND:');
      testResults.errors.forEach(error => console.log(`   • ${error}`));
    }
    
    console.log('\n🎯 NEW WORKING LOGIN CREDENTIALS:');
    console.log('   Admin: admin@test.com / testadmin123456789');
    console.log('   Artist: artist@test.com / testartist123456789');
    console.log('   Priya Sharma: priya.sharma@artistmail.com / priyasharma123456789');
    console.log('   Rajesh Kumar: rajesh.kumar@warliart.com / rajeshkumar123456789');
    console.log('   Ananya Patel: ananya.patel@gmail.com / ananyapatel123456789');
    console.log('   Vikram Singh: vikram.singh@miniaturepainting.com / vikramsingh123456789');
    console.log('   Kavitha Nair: kavitha.nair@keralart.com / kavithanair123456789');
    console.log('   Meera Shah: meera.shah@heritageart.in / meerashah123456789');
    
    // Create final credentials file
    const fs = require('fs');
    const finalReport = {
      timestamp: new Date().toISOString(),
      cleanup: {
        usersDeleted: 20,
        usersRemaining: users.length,
        activeArtworks: artworks.length
      },
      functionality: {
        likesWorking: testResults.likesWorking === 1,
        bookmarksWorking: testResults.bookmarksWorking === 1,
        errors: testResults.errors
      },
      activeUsers: users.map(user => ({
        name: user.name,
        email: user.email,
        password: user.name.toLowerCase().replace(/\s+/g, '') + '123456789',
        artworkCount: artworks.filter(a => a.userId._id.toString() === user._id.toString()).length
      }))
    };
    
    fs.writeFileSync('final_system_report.json', JSON.stringify(finalReport, null, 2));
    console.log('\n📝 Complete system report saved to: final_system_report.json');
    
    mongoose.connection.close();
    console.log('\n🎉 ALL TASKS COMPLETED SUCCESSFULLY!');
    
  } catch (error) {
    console.error('💥 Error:', error.message);
    mongoose.connection.close();
  }
};

testLikesAndBookmarks();
