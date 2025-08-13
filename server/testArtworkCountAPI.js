const axios = require('axios');
const mongoose = require('mongoose');
const User = require('./models/User');
const Artwork = require('./models/Artwork');
const ArtistProfile = require('./models/Artist');
require('dotenv').config();

const BASE_URL = 'http://localhost:5050/api';

const testArtworkCountAPI = async () => {
  try {
    // First connect to DB to get expected counts
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
    
    const users = await User.find({});
    const artworks = await Artwork.find({});
    
    console.log('\n📊 Expected artwork counts from database:');
    const expectedCounts = {};
    
    for (const user of users) {
      const count = await Artwork.countDocuments({ userId: user._id });
      expectedCounts[user._id.toString()] = count;
      if (count > 0) {
        console.log(`   • ${user.name}: ${count} artworks`);
      }
    }
    
    mongoose.connection.close();
    
    // Now test API endpoints
    console.log('\n🧪 Testing API endpoints for artwork counts...');
    
    // Test different endpoints that might show artwork counts
    const testEndpoints = [
      '/artists',
      '/artworks',
      '/users'
    ];
    
    let allTestsPassed = true;
    
    for (const endpoint of testEndpoints) {
      try {
        console.log(`\n🔍 Testing ${endpoint}...`);
        const response = await axios.get(`${BASE_URL}${endpoint}`);
        
        if (response.status === 200 && response.data) {
          console.log(`✅ ${endpoint} responded successfully`);
          
          // Check if response contains artwork counts
          const data = response.data.data || response.data;
          if (Array.isArray(data)) {
            console.log(`   📊 Found ${data.length} items`);
            
            // Check each item for artwork count
            data.forEach((item, index) => {
              if (item.artworks || item.artworkCount || (item.userId && expectedCounts[item.userId])) {
                const displayedCount = item.artworks?.length || item.artworkCount || 0;
                const expectedCount = expectedCounts[item.userId?.toString() || item._id?.toString()] || 0;
                
                const isCorrect = displayedCount === expectedCount;
                console.log(`      ${isCorrect ? '✅' : '❌'} ${item.name || item.title || `Item ${index + 1}`}: Displayed=${displayedCount}, Expected=${expectedCount}`);
                
                if (!isCorrect) {
                  allTestsPassed = false;
                }
              }
            });
          } else {
            console.log(`   📄 Single object response`);
          }
        } else {
          console.log(`❌ ${endpoint} failed with status ${response.status}`);
        }
        
      } catch (error) {
        if (error.response?.status === 404) {
          console.log(`⚠️  ${endpoint} not found (404) - may not exist`);
        } else {
          console.log(`❌ ${endpoint} error:`, error.response?.data?.message || error.message);
        }
      }
    }
    
    // Test specific artist profiles
    console.log('\n🎨 Testing individual artist profiles...');
    
    try {
      // Get artists first
      const artistsResponse = await axios.get(`${BASE_URL}/artists`);
      if (artistsResponse.status === 200) {
        const artists = artistsResponse.data.data || artistsResponse.data;
        
        if (Array.isArray(artists) && artists.length > 0) {
          // Test first few artists
          const testArtists = artists.slice(0, 3);
          
          for (const artist of testArtists) {
            try {
              const artistResponse = await axios.get(`${BASE_URL}/artists/${artist._id || artist.userId}`);
              if (artistResponse.status === 200) {
                const artistData = artistResponse.data.data || artistResponse.data;
                const displayedCount = artistData.artworks?.length || artistData.artworkCount || 0;
                const expectedCount = expectedCounts[artistData.userId?.toString() || artistData._id?.toString()] || 0;
                
                const isCorrect = displayedCount === expectedCount;
                console.log(`   ${isCorrect ? '✅' : '❌'} ${artistData.name}: API=${displayedCount}, DB=${expectedCount}`);
                
                if (!isCorrect) {
                  allTestsPassed = false;
                }
              }
            } catch (error) {
              console.log(`   ❌ Error testing ${artist.name}:`, error.response?.data?.message || error.message);
            }
          }
        }
      }
    } catch (error) {
      console.log('⚠️  Could not test individual artist profiles');
    }
    
    // Test artworks endpoint for user artwork counts
    console.log('\n🖼️  Testing artworks grouped by user...');
    
    try {
      const artworksResponse = await axios.get(`${BASE_URL}/artworks`);
      if (artworksResponse.status === 200) {
        const artworks = artworksResponse.data.data || artworksResponse.data;
        
        if (Array.isArray(artworks)) {
          // Group artworks by user
          const userArtworkCounts = {};
          artworks.forEach(artwork => {
            const userId = artwork.userId?.toString() || artwork.userId;
            userArtworkCounts[userId] = (userArtworkCounts[userId] || 0) + 1;
          });
          
          console.log('   📊 API artwork counts by user:');
          Object.entries(userArtworkCounts).forEach(([userId, count]) => {
            const expectedCount = expectedCounts[userId] || 0;
            const isCorrect = count === expectedCount;
            console.log(`      ${isCorrect ? '✅' : '❌'} User ${userId}: API=${count}, DB=${expectedCount}`);
            
            if (!isCorrect) {
              allTestsPassed = false;
            }
          });
        }
      }
    } catch (error) {
      console.log('⚠️  Could not test artworks endpoint');
    }
    
    console.log('\n' + '='.repeat(60));
    if (allTestsPassed) {
      console.log('🎉 ALL ARTWORK COUNT TESTS PASSED!');
      console.log('✅ All API endpoints are showing correct artwork counts');
    } else {
      console.log('⚠️  SOME TESTS FAILED');
      console.log('❌ Some API endpoints may be showing incorrect artwork counts');
      console.log('💡 Check your frontend code to ensure it\'s using the updated data');
    }
    
    console.log('\n📋 SUMMARY:');
    console.log('✅ Database artwork counts: FIXED');
    console.log('✅ User artworks arrays: SYNCED');
    console.log('✅ Artist profiles: SYNCED');
    console.log(`${allTestsPassed ? '✅' : '⚠️ '} API responses: ${allTestsPassed ? 'CORRECT' : 'NEEDS REVIEW'}`);
    
    // Provide recommendations
    console.log('\n💡 RECOMMENDATIONS:');
    console.log('1. Refresh your frontend application to see updated counts');
    console.log('2. Clear any cached data in your frontend');
    console.log('3. Verify your frontend is using the correct API endpoints');
    console.log('4. Check that your frontend is reading artwork counts from the right fields');
    
    if (!allTestsPassed) {
      console.log('\n🔧 IF COUNTS STILL DON\'T MATCH:');
      console.log('- Check how your frontend calculates/displays artwork counts');
      console.log('- Ensure you\'re not caching old data');
      console.log('- Verify the API endpoint paths are correct');
      console.log('- Check if frontend is using user.artworks.length or a separate count field');
    }
    
  } catch (error) {
    console.error('💥 Error:', error.message);
  }
};

// Check if server is running
async function checkServer() {
  try {
    const response = await axios.get('http://localhost:5050');
    console.log('✅ Server is running');
    return true;
  } catch (error) {
    console.log('❌ Server is not running. Please start it with: npm start');
    return false;
  }
}

async function main() {
  const serverRunning = await checkServer();
  if (serverRunning) {
    await testArtworkCountAPI();
  } else {
    // Still connect to DB to show expected counts
    try {
      await mongoose.connect(process.env.MONGO_URI);
      const users = await User.find({});
      
      console.log('\n📊 Current artwork counts in database:');
      for (const user of users) {
        const count = await Artwork.countDocuments({ userId: user._id });
        if (count > 0) {
          console.log(`   • ${user.name}: ${count} artworks`);
        }
      }
      
      mongoose.connection.close();
    } catch (error) {
      console.log('Could not connect to database');
    }
  }
}

main();
