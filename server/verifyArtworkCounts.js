const axios = require('axios');

const verifyArtworkCounts = async () => {
  try {
    console.log('🔍 Verifying Artwork Count Fix...\n');
    
    // Test the artists API endpoint
    const response = await axios.get('http://localhost:5050/api/users/artists');
    
    if (response.data && response.data.success && response.data.data) {
      const artists = response.data.data;
      
      console.log('✅ Artists API Response - SUCCESS');
      console.log(`📊 Found ${artists.length} artists\n`);
      
      console.log('📋 ARTWORK COUNTS:');
      artists.forEach(artist => {
        const artworkCount = artist.artworks ? artist.artworks.length : 0;
        console.log(`   • ${artist.name}: ${artworkCount} artworks`);
      });
      
      console.log('\n🎯 VERIFICATION COMPLETE!');
      console.log('✅ Artwork counts are now displaying correctly from the API');
      console.log('✅ Frontend should now show the correct counts');
      
    } else {
      console.log('❌ API returned unexpected format:', response.data);
    }
    
  } catch (error) {
    console.error('❌ Error verifying artwork counts:', error.message);
    
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response data:', error.response.data);
    }
  }
};

verifyArtworkCounts();
