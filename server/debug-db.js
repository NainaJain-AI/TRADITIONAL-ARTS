const mongoose = require('mongoose');
require('dotenv').config();

async function checkDatabase() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    const Artwork = require('./models/Artwork');
    
    // Count total artworks
    const totalArtworks = await Artwork.countDocuments();
    console.log('Total artworks in database:', totalArtworks);
    
    // Count active artworks
    const activeArtworks = await Artwork.countDocuments({ isActive: true });
    console.log('Active artworks:', activeArtworks);
    
    // Count public artworks
    const publicArtworks = await Artwork.countDocuments({ isPublic: true, isActive: true });
    console.log('Public active artworks:', publicArtworks);
    
    // Check for duplicate titles
    const duplicateCheck = await Artwork.aggregate([
      { $group: { _id: { title: '$title', userId: '$userId' }, count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } }
    ]);
    
    if (duplicateCheck.length > 0) {
      console.log('Found duplicate artworks:', duplicateCheck.length);
      console.log('Duplicates:', duplicateCheck);
    } else {
      console.log('No duplicate artworks found');
    }
    
    // Check like/bookmark data
    const artworksWithLikes = await Artwork.find({ likes: { $exists: true, $ne: [] } }).limit(5);
    console.log('\nSample artworks with likes:');
    artworksWithLikes.forEach(artwork => {
      console.log(`  - Title: "${artwork.title}"`);
      console.log(`    Likes count: ${artwork.likes.length}`);
      console.log(`    Likes is array: ${Array.isArray(artwork.likes)}`);
      console.log(`    First few likes:`, artwork.likes.slice(0, 3));
      console.log(`    Bookmarks count: ${artwork.bookmarks ? artwork.bookmarks.length : 0}`);
      console.log(`    Views: ${artwork.views || 0}`);
      console.log(`    Created: ${artwork.createdAt}`);
      console.log('    ---');
    });
    
    // Check for artworks with extremely high like counts
    const highLikeArtworks = await Artwork.find().sort({ likes: -1 }).limit(3);
    console.log('\nArtworks with highest like counts:');
    highLikeArtworks.forEach(artwork => {
      console.log(`  - "${artwork.title}": ${artwork.likes.length} likes`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Database check error:', error);
    process.exit(1);
  }
}

checkDatabase();
