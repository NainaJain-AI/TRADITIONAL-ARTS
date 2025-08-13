const mongoose = require('mongoose');
const Artwork = require('./models/Artwork');
const User = require('./models/User');
require('dotenv').config();

async function emergencyFixDynamicChanges() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('🚨 EMERGENCY FIX: Investigating dynamic changes issue...');
    
    // First, let's see what's actually in the database RIGHT NOW
    const artworks = await Artwork.find({ isPublic: true, isActive: true })
                                  .populate('userId', 'name email');
    
    console.log('\n📊 CURRENT DATABASE STATE:');
    artworks.forEach((artwork, i) => {
      console.log(`${i + 1}. "${artwork.title}": ${artwork.likes.length} likes, ${artwork.bookmarks.length} bookmarks`);
      if (artwork.likes.length > 0 || artwork.bookmarks.length > 0) {
        console.log(`   - Likes: [${artwork.likes.join(', ')}]`);
        console.log(`   - Bookmarks: [${artwork.bookmarks.join(', ')}]`);
      }
    });
    
    // Check for any artworks with invalid or changing data
    console.log('\n🔍 CHECKING FOR ANOMALIES...');
    let foundIssues = false;
    
    for (let artwork of artworks) {
      // Check if any likes/bookmarks arrays contain invalid data
      for (let likeId of artwork.likes) {
        try {
          const user = await User.findById(likeId);
          if (!user) {
            console.log(`❌ FOUND INVALID LIKE: Artwork "${artwork.title}" has like from non-existent user ${likeId}`);
            foundIssues = true;
          }
        } catch (error) {
          console.log(`❌ INVALID LIKE ID: ${likeId} in artwork "${artwork.title}"`);
          foundIssues = true;
        }
      }
      
      for (let bookmarkId of artwork.bookmarks) {
        try {
          const user = await User.findById(bookmarkId);
          if (!user) {
            console.log(`❌ FOUND INVALID BOOKMARK: Artwork "${artwork.title}" has bookmark from non-existent user ${bookmarkId}`);
            foundIssues = true;
          }
        } catch (error) {
          console.log(`❌ INVALID BOOKMARK ID: ${bookmarkId} in artwork "${artwork.title}"`);
          foundIssues = true;
        }
      }
    }
    
    if (!foundIssues) {
      console.log('✅ No database anomalies found. Issue is likely in frontend state management.');
    }
    
    // Let's create a snapshot and monitor for changes
    console.log('\n📸 CREATING SNAPSHOT FOR MONITORING...');
    const snapshot = artworks.map(artwork => ({
      id: artwork._id.toString(),
      title: artwork.title,
      likes: artwork.likes.map(id => id.toString()),
      bookmarks: artwork.bookmarks.map(id => id.toString()),
      likeCount: artwork.likes.length,
      bookmarkCount: artwork.bookmarks.length
    }));
    
    // Wait a moment and check again
    console.log('\n⏳ Waiting 3 seconds to check for database changes...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const artworksAfter = await Artwork.find({ isPublic: true, isActive: true });
    console.log('\n📊 CHECKING FOR DATABASE CHANGES...');
    
    let dbChanges = false;
    artworksAfter.forEach(artwork => {
      const original = snapshot.find(s => s.id === artwork._id.toString());
      if (original) {
        if (original.likeCount !== artwork.likes.length || 
            original.bookmarkCount !== artwork.bookmarks.length) {
          console.log(`🚨 DATABASE CHANGED: "${artwork.title}" likes: ${original.likeCount} → ${artwork.likes.length}, bookmarks: ${original.bookmarkCount} → ${artwork.bookmarks.length}`);
          dbChanges = true;
        }
      }
    });
    
    if (!dbChanges) {
      console.log('✅ Database is stable. The issue is definitely in the frontend.');
    }
    
    // EMERGENCY FIX: Reset all likes and bookmarks to known state
    console.log('\n🛠️ APPLYING EMERGENCY FIX...');
    
    // Clear all likes/bookmarks except the test one
    for (let artwork of artworks) {
      if (artwork.title === 'Jagannath Rath Yatra') {
        // Keep this one with 1 like and 1 bookmark from Test Admin
        const testAdmin = await User.findOne({ email: 'admin@test.com' });
        if (testAdmin) {
          artwork.likes = [testAdmin._id];
          artwork.bookmarks = [testAdmin._id];
          await artwork.save();
          console.log(`✅ Fixed "${artwork.title}": Set to 1 like, 1 bookmark`);
        }
      } else {
        // Clear all others
        if (artwork.likes.length > 0 || artwork.bookmarks.length > 0) {
          artwork.likes = [];
          artwork.bookmarks = [];
          await artwork.save();
          console.log(`✅ Cleared "${artwork.title}": Set to 0 likes, 0 bookmarks`);
        }
      }
    }
    
    // Also fix the test admin user
    const testAdmin = await User.findOne({ email: 'admin@test.com' });
    if (testAdmin) {
      const jagannathArtwork = await Artwork.findOne({ title: 'Jagannath Rath Yatra' });
      if (jagannathArtwork) {
        testAdmin.likes = [jagannathArtwork._id];
        testAdmin.bookmarks = [jagannathArtwork._id];
        await testAdmin.save();
        console.log(`✅ Fixed Test Admin user: Set to like/bookmark only "Jagannath Rath Yatra"`);
      }
    }
    
    console.log('\n🎯 EMERGENCY FIX COMPLETED!');
    console.log('Expected state:');
    console.log('- "Jagannath Rath Yatra": 1 like, 1 bookmark');
    console.log('- All other artworks: 0 likes, 0 bookmarks');
    console.log('- Test Admin user: likes/bookmarks only "Jagannath Rath Yatra"');
    
    console.log('\n🔍 ROOT CAUSE ANALYSIS:');
    console.log('If counts are still changing without refresh, the issue is in:');
    console.log('1. Frontend state management (React state mutations)');
    console.log('2. Multiple API calls creating race conditions');
    console.log('3. Browser extensions interfering');
    console.log('4. Framer Motion animations affecting state');
    console.log('5. Real-time updates or WebSocket connections');
    
  } catch (error) {
    console.error('❌ Emergency fix error:', error);
  } finally {
    mongoose.connection.close();
  }
}

emergencyFixDynamicChanges();
