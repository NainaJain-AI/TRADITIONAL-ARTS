const axios = require('axios');

async function testAllArtworks() {
  try {
    console.log('🧪 Testing All Artworks API...');
    
    // Get all artworks with higher limit
    const response = await axios.get('http://localhost:5050/api/artworks?limit=50', {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ API Response Status:', response.status);
    console.log('📦 Total artworks returned:', response.data.data?.length);
    
    if (response.data.data && response.data.data.length > 0) {
      console.log('\n📊 All artworks with like/bookmark counts:');
      
      let totalLikes = 0;
      let totalBookmarks = 0;
      let artworksWithLikes = [];
      let artworksWithBookmarks = [];
      
      response.data.data.forEach((artwork, i) => {
        const likeCount = typeof artwork.likes === 'number' ? artwork.likes : 
                         (Array.isArray(artwork.likes) ? artwork.likes.length : 0);
        const bookmarkCount = typeof artwork.bookmarks === 'number' ? artwork.bookmarks : 
                             (Array.isArray(artwork.bookmarks) ? artwork.bookmarks.length : 0);
        
        totalLikes += likeCount;
        totalBookmarks += bookmarkCount;
        
        if (likeCount > 0) {
          artworksWithLikes.push(`"${artwork.title}": ${likeCount} likes`);
        }
        
        if (bookmarkCount > 0) {
          artworksWithBookmarks.push(`"${artwork.title}": ${bookmarkCount} bookmarks`);
        }
        
        console.log(`${i + 1}. "${artwork.title}": ${likeCount} likes, ${bookmarkCount} bookmarks`);
      });
      
      console.log('\n📈 SUMMARY:');
      console.log(`Total likes across all artworks: ${totalLikes}`);
      console.log(`Total bookmarks across all artworks: ${totalBookmarks}`);
      console.log(`Artworks with likes: ${artworksWithLikes.length}`);
      console.log(`Artworks with bookmarks: ${artworksWithBookmarks.length}`);
      
      if (artworksWithLikes.length > 0) {
        console.log('\n💖 Artworks with likes:');
        artworksWithLikes.forEach(artwork => console.log(`  - ${artwork}`));
      }
      
      if (artworksWithBookmarks.length > 0) {
        console.log('\n🔖 Artworks with bookmarks:');
        artworksWithBookmarks.forEach(artwork => console.log(`  - ${artwork}`));
      }
      
      // Check specific artwork that should have likes
      const jagannathArtwork = response.data.data.find(artwork => 
        artwork.title === 'Jagannath Rath Yatra'
      );
      
      if (jagannathArtwork) {
        console.log('\n🎯 Found "Jagannath Rath Yatra":');
        console.log('  - Likes:', jagannathArtwork.likes);
        console.log('  - Bookmarks:', jagannathArtwork.bookmarks);
        console.log('  - Type of likes:', typeof jagannathArtwork.likes);
        console.log('  - Type of bookmarks:', typeof jagannathArtwork.bookmarks);
      } else {
        console.log('\n⚠️ "Jagannath Rath Yatra" not found in API response');
      }
    }
    
  } catch (error) {
    console.error('❌ API Test Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testAllArtworks();
