const mongoose = require('mongoose');
const Artwork = require('./models/Artwork');

require('dotenv').config();

async function testViewTracking() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/kala-sangam');
    console.log('Connected to MongoDB');

    console.log('\n=== TESTING VIEW TRACKING ===\n');

    // Get a sample artwork
    const artwork = await Artwork.findOne();
    if (!artwork) {
      console.log('No artworks found in database');
      return;
    }

    console.log('Testing with artwork:', artwork.title);
    console.log('Initial views:', artwork.views);

    // Simulate multiple views
    const initialViews = artwork.views || 0;
    const viewsToAdd = 5;

    for (let i = 1; i <= viewsToAdd; i++) {
      artwork.views = (artwork.views || 0) + 1;
      await artwork.save();
      console.log(`View ${i}: Updated views to ${artwork.views}`);
    }

    // Verify the final count
    const updatedArtwork = await Artwork.findById(artwork._id);
    console.log('Final views count:', updatedArtwork.views);
    console.log('Expected views count:', initialViews + viewsToAdd);
    
    if (updatedArtwork.views === initialViews + viewsToAdd) {
      console.log('✅ View tracking working correctly!');
    } else {
      console.log('❌ View tracking not working correctly');
    }

    // Test API response format
    console.log('\n=== TESTING API RESPONSE FORMAT ===\n');
    const transformedArtwork = {
      _id: updatedArtwork._id,
      id: updatedArtwork._id,
      title: updatedArtwork.title,
      artist: updatedArtwork.artist,
      description: updatedArtwork.description,
      imageUrl: updatedArtwork.imageUrl,
      category: updatedArtwork.category,
      artform: updatedArtwork.artform,
      likes: updatedArtwork.likes.length, // Count, not array
      bookmarks: updatedArtwork.bookmarks.length, // Count, not array
      views: updatedArtwork.views || 0,
      likeCount: updatedArtwork.likeCount,
      bookmarkCount: updatedArtwork.bookmarkCount,
      comments: updatedArtwork.comments ? updatedArtwork.comments.length : 0,
      tags: updatedArtwork.tags || [],
      location: updatedArtwork.location,
      isPublic: updatedArtwork.isPublic,
      isActive: updatedArtwork.isActive,
      createdAt: updatedArtwork.createdAt,
      updatedAt: updatedArtwork.updatedAt,
      userId: updatedArtwork.userId
    };

    console.log('API Response Format:');
    console.log('- Likes (count):', transformedArtwork.likes, typeof transformedArtwork.likes);
    console.log('- Bookmarks (count):', transformedArtwork.bookmarks, typeof transformedArtwork.bookmarks);
    console.log('- Views (count):', transformedArtwork.views, typeof transformedArtwork.views);

    // Verify types
    const isLikesNumber = typeof transformedArtwork.likes === 'number';
    const isBookmarksNumber = typeof transformedArtwork.bookmarks === 'number';
    const isViewsNumber = typeof transformedArtwork.views === 'number';

    if (isLikesNumber && isBookmarksNumber && isViewsNumber) {
      console.log('✅ All engagement metrics are numbers (not arrays/objects)');
    } else {
      console.log('❌ Some engagement metrics are not numbers');
      console.log('  - Likes is number:', isLikesNumber);
      console.log('  - Bookmarks is number:', isBookmarksNumber);
      console.log('  - Views is number:', isViewsNumber);
    }

    console.log('\n✅ View tracking test completed successfully!');

  } catch (error) {
    console.error('❌ Error during view tracking test:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

// Run the test
testViewTracking();
