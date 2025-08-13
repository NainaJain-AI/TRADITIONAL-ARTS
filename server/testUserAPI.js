const axios = require('axios');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const mongoose = require('mongoose');
require('dotenv').config();

async function testUserAPI() {
  try {
    console.log('🧪 Testing User API and Auth...');
    
    // Connect to MongoDB to get user data
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
    
    // Get the test admin user
    const testUser = await User.findOne({ email: 'admin@test.com' });
    
    if (!testUser) {
      console.log('❌ Test user not found');
      return;
    }
    
    console.log('\n👤 Test User Data from Database:');
    console.log('- Name:', testUser.name);
    console.log('- Email:', testUser.email);
    console.log('- ID:', testUser._id);
    console.log('- Likes array:', testUser.likes);
    console.log('- Bookmarks array:', testUser.bookmarks);
    console.log('- Likes count:', testUser.likes ? testUser.likes.length : 0);
    console.log('- Bookmarks count:', testUser.bookmarks ? testUser.bookmarks.length : 0);
    
    // Generate a JWT token for API testing
    const token = jwt.sign(
      { id: testUser._id, email: testUser.email },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
    
    console.log('\n🔑 Generated JWT token for API testing');
    
    // Test login API
    try {
      const loginResponse = await axios.post('http://localhost:5050/api/auth/login', {
        email: 'admin@test.com',
        password: 'testadmin123456789'
      });
      
      console.log('\n🚪 Login API Response:');
      console.log('- Success:', loginResponse.data.success);
      console.log('- User ID:', loginResponse.data.user?.id);
      console.log('- User Likes:', loginResponse.data.user?.likes);
      console.log('- User Bookmarks:', loginResponse.data.user?.bookmarks);
      console.log('- Token present:', !!loginResponse.data.token);
      
      // Use the token from login response for further API calls
      const authToken = loginResponse.data.token;
      
      // Test user profile API
      const profileResponse = await axios.get('http://localhost:5050/api/users/profile', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('\n👤 Profile API Response:');
      console.log('- Success:', profileResponse.data.success);
      console.log('- User ID:', profileResponse.data.user?.id);
      console.log('- User Likes:', profileResponse.data.user?.likes);
      console.log('- User Bookmarks:', profileResponse.data.user?.bookmarks);
      
    } catch (authError) {
      console.error('❌ Auth API Error:', authError.response?.data || authError.message);
    }
    
  } catch (error) {
    console.error('❌ Test Error:', error.message);
  } finally {
    mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
}

testUserAPI();
