const mongoose = require('mongoose');
const User = require('./models/User');
const Artwork = require('./models/Artwork');
require('dotenv').config();

async function testArtworkFlow() {
  try {
    console.log('🔍 Testing Artwork Creation and Retrieval Flow\n');

    // Connect to database
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/traditionalarts');
    console.log('✅ Connected to MongoDB');

    // Find test admin user
    const testUser = await User.findOne({ email: 'admin@test.com' });
    if (!testUser) {
      console.log('❌ Test user not found. Run createAdmin.js first.');
      return;
    }
    console.log(`✅ Found test user: ${testUser.name} (${testUser.email})`);

    // Create a test artwork
    const testArtwork = new Artwork({
      title: 'Test Artwork - ' + Date.now(),
      description: 'This is a test artwork to verify the creation flow',
      imageUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=500&h=500&fit=crop',
      category: 'Traditional Art',
      artform: 'Painting',
      userId: testUser._id,
      artist: testUser.name,
      tags: ['test', 'artwork'],
      isPublic: true,
      isActive: true
    });

    const savedArtwork = await testArtwork.save();
    console.log(`✅ Created artwork: ${savedArtwork.title} (ID: ${savedArtwork._id})`);

    // Test fetching all artworks (public only)
    const publicArtworks = await Artwork.find({ isPublic: true, isActive: true })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(10);
    
    console.log(`✅ Found ${publicArtworks.length} public artworks`);

    // Test fetching user-specific artworks
    const userArtworks = await Artwork.find({ userId: testUser._id, isActive: true })
      .sort({ createdAt: -1 })
      .limit(10);
    
    console.log(`✅ Found ${userArtworks.length} artworks for user ${testUser.name}`);

    // Test the getUserActivity functionality
    const userWithArtworks = await User.findById(testUser._id);
    console.log(`✅ User likes: ${userWithArtworks.likes?.length || 0}`);
    console.log(`✅ User bookmarks: ${userWithArtworks.bookmarks?.length || 0}`);

    // Show recent artworks
    console.log('\n📋 Recent Artworks:');
    publicArtworks.slice(0, 3).forEach((artwork, index) => {
      console.log(`${index + 1}. "${artwork.title}" by ${artwork.artist}`);
      console.log(`   Category: ${artwork.category}, Created: ${artwork.createdAt}`);
      console.log(`   Public: ${artwork.isPublic}, Active: ${artwork.isActive}`);
      console.log('');
    });

    // Clean up - delete the test artwork
    await Artwork.findByIdAndDelete(savedArtwork._id);
    console.log('🧹 Cleaned up test artwork');

    console.log('\n✅ All tests passed! Artwork flow is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

// Run the test
testArtworkFlow().catch(console.error);
