const axios = require('axios');

async function testArtworksAPI() {
  try {
    console.log('🧪 Testing Artworks API...');
    
    const response = await axios.get('http://localhost:5050/api/artworks', {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ API Response Status:', response.status);
    console.log('📦 Response Structure:');
    console.log('- success:', response.data.success);
    console.log('- data length:', response.data.data?.length);
    
    if (response.data.data && response.data.data.length > 0) {
      console.log('\n🎨 First Artwork Details:');
      const firstArtwork = response.data.data[0];
      console.log('- Title:', firstArtwork.title);
      console.log('- ID:', firstArtwork._id);
      console.log('- Likes (raw):', firstArtwork.likes);
      console.log('- Bookmarks (raw):', firstArtwork.bookmarks);
      console.log('- Like Count:', firstArtwork.likeCount);
      console.log('- Bookmark Count:', firstArtwork.bookmarkCount);
      
      console.log('\n📊 All artworks summary:');
      response.data.data.forEach((artwork, i) => {
        const likeCount = Array.isArray(artwork.likes) ? artwork.likes.length : artwork.likes;
        const bookmarkCount = Array.isArray(artwork.bookmarks) ? artwork.bookmarks.length : artwork.bookmarks;
        console.log(`${i + 1}. "${artwork.title}": ${likeCount} likes, ${bookmarkCount} bookmarks`);
      });
    }
    
  } catch (error) {
    console.error('❌ API Test Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testArtworksAPI();
