const axios = require('axios');
require('dotenv').config();

const BASE_URL = 'http://localhost:5050/api';

async function testFollowFeature() {
  try {
    console.log('🧪 Testing Follow Feature...\n');

    // Step 1: Login as admin user
    console.log('1. Logging in as admin...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/admin-login`, {
      email: 'admin@test.com',
      password: 'admin123'
    });

    if (!loginResponse.data.token) {
      console.log('❌ Login failed');
      return;
    }

    console.log('✅ Login successful');
    const token = loginResponse.data.token;
    const authHeaders = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // Step 2: Get current user info  
    const meResponse = await axios.get(`${BASE_URL}/auth/me`, { headers: authHeaders });
    const currentUserId = meResponse.data.user.id;
    console.log(`Current user ID: ${currentUserId}`);

    // Step 3: Get list of users to follow
    try {
      const usersResponse = await axios.get(`${BASE_URL}/users/artists`, { headers: authHeaders });
      console.log(`Found ${usersResponse.data.artists?.length || 0} artists`);
      
      if (usersResponse.data.artists && usersResponse.data.artists.length > 0) {
        const targetUser = usersResponse.data.artists[0];
        const targetUserId = targetUser._id || targetUser.id;
        
        console.log(`\nAttempting to follow user: ${targetUser.name} (ID: ${targetUserId})`);
        
        // Step 4: Try to follow a user
        try {
          const followResponse = await axios.post(`${BASE_URL}/following/follow/${targetUserId}`, {}, { headers: authHeaders });
          console.log('✅ Follow successful:', followResponse.data);
        } catch (followError) {
          console.log('❌ Follow failed:', followError.response?.status, followError.response?.data);
          console.log('Error details:', followError.message);
        }
      } else {
        console.log('No artists found to follow');
      }
    } catch (usersError) {
      console.log('❌ Failed to get users list:', usersError.response?.status, usersError.response?.data);
    }

  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
}

testFollowFeature();
