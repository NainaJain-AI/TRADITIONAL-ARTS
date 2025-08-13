const mongoose = require('mongoose');
const Artwork = require('./models/Artwork');
const User = require('./models/User');

require('dotenv').config();

async function testLikesBookmarksViews() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/kala-sangam');
    console.log('Connected to MongoDB');

    console.log('\n=== TESTING LIKES, BOOKMARKS, AND VIEWS ===\n');

    // 1. Test artwork data structure
    console.log('1. Testing artwork data structure...');
    const sampleArtwork = await Artwork.findOne();
    if (sampleArtwork) {
      console.log('Sample artwork structure:');
      console.log('- ID:', sampleArtwork._id.toString());
      console.log('- Title:', sampleArtwork.title);
      console.log('- Likes array length:', sampleArtwork.likes ? sampleArtwork.likes.length : 'N/A');
      console.log('- Bookmarks array length:', sampleArtwork.bookmarks ? sampleArtwork.bookmarks.length : 'N/A');
      console.log('- Views count:', sampleArtwork.views);
      console.log('- Virtual likeCount:', sampleArtwork.likeCount);
      console.log('- Virtual bookmarkCount:', sampleArtwork.bookmarkCount);
    } else {
      console.log('No artworks found in database');
    }

    // 2. Test user data structure
    console.log('\n2. Testing user data structure...');
    const sampleUser = await User.findOne();
    if (sampleUser) {
      console.log('Sample user structure:');
      console.log('- ID:', sampleUser._id.toString());
      console.log('- Name:', sampleUser.name);
      console.log('- Likes array length:', sampleUser.likes ? sampleUser.likes.length : 'N/A');
      console.log('- Bookmarks array length:', sampleUser.bookmarks ? sampleUser.bookmarks.length : 'N/A');
    } else {
      console.log('No users found in database');
    }

    // 3. Test artwork transformation (simulating API response)
    console.log('\n3. Testing artwork transformation...');
    const artworks = await Artwork.find().limit(3);
    const transformedArtworks = artworks.map(artwork => ({
      _id: artwork._id,
      id: artwork._id,
      title: artwork.title,
      artist: artwork.artist,
      description: artwork.description,
      imageUrl: artwork.imageUrl,
      category: artwork.category,
      artform: artwork.artform,
      likes: artwork.likes.length, // Should return count, not array
      bookmarks: artwork.bookmarks.length, // Should return count, not array
      views: artwork.views || 0,
      likeCount: artwork.likeCount,
      bookmarkCount: artwork.bookmarkCount,
      comments: artwork.comments ? artwork.comments.length : 0,
      tags: artwork.tags || [],
      location: artwork.location,
      isPublic: artwork.isPublic,
      isActive: artwork.isActive,
      createdAt: artwork.createdAt,
      updatedAt: artwork.updatedAt,
      userId: artwork.userId
    }));

    console.log('Transformed artworks:');
    transformedArtworks.forEach((artwork, index) => {
      console.log(`\nArtwork ${index + 1}:`);
      console.log('- Title:', artwork.title);
      console.log('- Likes (count):', artwork.likes);
      console.log('- Bookmarks (count):', artwork.bookmarks);
      console.log('- Views:', artwork.views);
      console.log('- Like count (virtual):', artwork.likeCount);
      console.log('- Bookmark count (virtual):', artwork.bookmarkCount);
    });

    // 4. Test views field existence
    console.log('\n4. Testing views field...');
    const artworksWithViews = await Artwork.countDocuments({ views: { $exists: true } });
    const totalArtworks = await Artwork.countDocuments();
    console.log(`Artworks with views field: ${artworksWithViews}/${totalArtworks}`);

    // 5. Test likes/bookmarks relationship integrity
    console.log('\n5. Testing likes/bookmarks relationship integrity...');
    const users = await User.find();
    let relationshipIssues = 0;

    for (const user of users) {
      // Check if user's liked artworks exist
      if (user.likes && user.likes.length > 0) {
        for (const artworkId of user.likes) {
          const artwork = await Artwork.findById(artworkId);
          if (artwork) {
            // Check if artwork has this user in its likes array
            const userInArtworkLikes = artwork.likes.some(likeUserId => 
              likeUserId.toString() === user._id.toString()
            );
            if (!userInArtworkLikes) {
              console.log(`❌ Inconsistency: User ${user.name} likes artwork ${artwork.title}, but artwork doesn't have user in likes`);
              relationshipIssues++;
            }
          } else {
            console.log(`❌ Inconsistency: User ${user.name} likes non-existent artwork ${artworkId}`);
            relationshipIssues++;
          }
        }
      }
      
      // Check if user's bookmarked artworks exist
      if (user.bookmarks && user.bookmarks.length > 0) {
        for (const artworkId of user.bookmarks) {
          const artwork = await Artwork.findById(artworkId);
          if (artwork) {
            // Check if artwork has this user in its bookmarks array
            const userInArtworkBookmarks = artwork.bookmarks.some(bookmarkUserId => 
              bookmarkUserId.toString() === user._id.toString()
            );
            if (!userInArtworkBookmarks) {
              console.log(`❌ Inconsistency: User ${user.name} bookmarks artwork ${artwork.title}, but artwork doesn't have user in bookmarks`);
              relationshipIssues++;
            }
          } else {
            console.log(`❌ Inconsistency: User ${user.name} bookmarks non-existent artwork ${artworkId}`);
            relationshipIssues++;
          }
        }
      }
    }

    if (relationshipIssues === 0) {
      console.log('✅ All likes/bookmarks relationships are consistent');
    } else {
      console.log(`❌ Found ${relationshipIssues} relationship inconsistencies`);
    }

    // 6. Statistics summary
    console.log('\n6. Statistics summary...');
    const usersWithLikes = await User.countDocuments({ 'likes.0': { $exists: true } });
    const usersWithBookmarks = await User.countDocuments({ 'bookmarks.0': { $exists: true } });
    const artworksWithLikes = await Artwork.countDocuments({ 'likes.0': { $exists: true } });
    const artworksWithBookmarks = await Artwork.countDocuments({ 'bookmarks.0': { $exists: true } });

    console.log(`Users with likes: ${usersWithLikes}`);
    console.log(`Users with bookmarks: ${usersWithBookmarks}`);
    console.log(`Artworks with likes: ${artworksWithLikes}`);
    console.log(`Artworks with bookmarks: ${artworksWithBookmarks}`);
    console.log(`Total users: ${await User.countDocuments()}`);
    console.log(`Total artworks: ${totalArtworks}`);

    console.log('\n✅ Test completed successfully!');

  } catch (error) {
    console.error('❌ Error during testing:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

// Run the test
testLikesBookmarksViews();
