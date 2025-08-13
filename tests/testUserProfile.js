const mongoose = require('mongoose');
const User = require('./models/User');

require('dotenv').config();

async function testUserProfile() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/kala-sangam');
    console.log('Connected to MongoDB');

    // Get a user with likes and bookmarks
    const userWithLikes = await User.findOne({ 'likes.0': { $exists: true } });
    
    if (!userWithLikes) {
      console.log('No user found with likes');
      return;
    }

    console.log('\n=== USER PROFILE TEST ===');
    console.log('User:', userWithLikes.name);
    console.log('ID:', userWithLikes._id.toString());
    console.log('Likes count:', userWithLikes.likes.length);
    console.log('Bookmarks count:', userWithLikes.bookmarks.length);
    console.log('First few likes:', userWithLikes.likes.slice(0, 3));
    console.log('First few bookmarks:', userWithLikes.bookmarks.slice(0, 3));

    // Simulate the API response format
    const apiResponse = {
      user: {
        id: userWithLikes._id,
        name: userWithLikes.name,
        email: userWithLikes.email,
        avatar: userWithLikes.avatar,
        coverImage: userWithLikes.coverImage,
        portfolioUrl: userWithLikes.portfolioUrl,
        socialLinks: userWithLikes.socialLinks || {},
        bio: userWithLikes.bio,
        location: userWithLikes.location,
        specialization: userWithLikes.specialization,
        role: userWithLikes.role,
        likes: userWithLikes.likes,
        follows: userWithLikes.follows,
        bookmarks: userWithLikes.bookmarks,
        createdAt: userWithLikes.createdAt,
        updatedAt: userWithLikes.updatedAt
      }
    };

    console.log('\n=== API RESPONSE FORMAT ===');
    console.log('Likes array length:', apiResponse.user.likes.length);
    console.log('Bookmarks array length:', apiResponse.user.bookmarks.length);
    console.log('Sample API response structure:', {
      id: apiResponse.user.id,
      name: apiResponse.user.name,
      likesCount: apiResponse.user.likes.length,
      bookmarksCount: apiResponse.user.bookmarks.length
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
  }
}

testUserProfile();
