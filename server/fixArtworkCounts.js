const mongoose = require('mongoose');
const User = require('./models/User');
const Artwork = require('./models/Artwork');
const ArtistProfile = require('./models/Artist');
require('dotenv').config();

const fixArtworkCounts = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
    
    // Get all users and artworks
    const users = await User.find({});
    const artworks = await Artwork.find({});
    const artistProfiles = await ArtistProfile.find({});
    
    console.log(`\n📊 Found ${users.length} users, ${artworks.length} artworks, ${artistProfiles.length} artist profiles`);
    
    console.log('\n🔍 Analyzing artwork count mismatches...\n');
    
    const issues = [];
    
    // Check each user's artwork count
    for (const user of users) {
      // Count actual artworks for this user
      const actualArtworkCount = await Artwork.countDocuments({ userId: user._id });
      
      // Check if user has artworks array and if it matches
      const userArtworksArray = user.artworks || [];
      const userArrayCount = userArtworksArray.length;
      
      // Find associated artist profile
      const artistProfile = await ArtistProfile.findOne({ userId: user._id });
      const artistProfileCount = artistProfile?.artworks?.length || 0;
      
      console.log(`👤 ${user.name} (${user.email}):`);
      console.log(`   📊 Actual artworks in DB: ${actualArtworkCount}`);
      console.log(`   👤 User artworks array: ${userArrayCount}`);
      console.log(`   🎨 Artist profile count: ${artistProfileCount}`);
      
      let hasMismatch = false;
      const userIssues = [];
      
      // Check for mismatches
      if (userArrayCount !== actualArtworkCount) {
        userIssues.push(`User array count (${userArrayCount}) ≠ actual count (${actualArtworkCount})`);
        hasMismatch = true;
      }
      
      if (artistProfile && artistProfileCount !== actualArtworkCount) {
        userIssues.push(`Artist profile count (${artistProfileCount}) ≠ actual count (${actualArtworkCount})`);
        hasMismatch = true;
      }
      
      if (hasMismatch) {
        console.log(`   ❌ MISMATCH FOUND:`);
        userIssues.forEach(issue => console.log(`      • ${issue}`));
        
        issues.push({
          userId: user._id,
          userName: user.name,
          email: user.email,
          actualCount: actualArtworkCount,
          userArrayCount,
          artistProfileCount,
          issues: userIssues
        });
      } else {
        console.log(`   ✅ Counts match correctly`);
      }
      
      console.log('');
    }
    
    if (issues.length === 0) {
      console.log('🎉 No artwork count mismatches found!');
      mongoose.connection.close();
      return;
    }
    
    console.log('\n' + '='.repeat(60));
    console.log(`🔧 FIXING ${issues.length} ARTWORK COUNT MISMATCHES`);
    console.log('='.repeat(60));
    
    let fixedCount = 0;
    
    for (const issue of issues) {
      try {
        console.log(`\n🔧 Fixing: ${issue.userName}`);
        
        // Get actual artworks for this user
        const userArtworks = await Artwork.find({ userId: issue.userId });
        const artworkIds = userArtworks.map(artwork => artwork._id.toString());
        
        console.log(`   📋 Found ${userArtworks.length} actual artworks:`);
        userArtworks.forEach((artwork, index) => {
          console.log(`      ${index + 1}. "${artwork.title}" (${artwork.category})`);
        });
        
        // Update user's artworks array
        const user = await User.findById(issue.userId);
        if (user) {
          user.artworks = artworkIds;
          await user.save();
          console.log(`   ✅ Updated user artworks array: ${artworkIds.length} items`);
        }
        
        // Update artist profile if exists
        const artistProfile = await ArtistProfile.findOne({ userId: issue.userId });
        if (artistProfile) {
          artistProfile.artworks = artworkIds;
          await artistProfile.save();
          console.log(`   ✅ Updated artist profile artworks: ${artworkIds.length} items`);
        } else {
          // Create artist profile if it doesn't exist and user has artworks
          if (userArtworks.length > 0 && user.role === 'Artist') {
            await ArtistProfile.create({
              userId: user._id,
              name: user.name,
              email: user.email,
              bio: user.bio || "",
              profilePic: user.avatar || "",
              artworks: artworkIds
            });
            console.log(`   ✅ Created new artist profile with ${artworkIds.length} artworks`);
          }
        }
        
        fixedCount++;
        
      } catch (error) {
        console.log(`   ❌ Error fixing ${issue.userName}: ${error.message}`);
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📋 VERIFICATION AFTER FIXES');
    console.log('='.repeat(60));
    
    // Verify all counts are now correct
    for (const user of users) {
      const actualCount = await Artwork.countDocuments({ userId: user._id });
      const updatedUser = await User.findById(user._id);
      const updatedArtistProfile = await ArtistProfile.findOne({ userId: user._id });
      
      const userCount = updatedUser.artworks?.length || 0;
      const artistCount = updatedArtistProfile?.artworks?.length || 0;
      
      const allMatch = (userCount === actualCount) && (!updatedArtistProfile || artistCount === actualCount);
      
      console.log(`${allMatch ? '✅' : '❌'} ${user.name}: DB=${actualCount}, User=${userCount}, Artist=${artistCount}`);
    }
    
    // Create summary report
    const fs = require('fs');
    const report = {
      timestamp: new Date().toISOString(),
      totalUsers: users.length,
      issuesFound: issues.length,
      issuesFixed: fixedCount,
      userArtworkCounts: users.map(user => ({
        name: user.name,
        email: user.email,
        actualArtworkCount: artworks.filter(a => a.userId.toString() === user._id.toString()).length
      }))
    };
    
    fs.writeFileSync('artwork_count_fix_report.json', JSON.stringify(report, null, 2));
    
    console.log('\n🎉 ARTWORK COUNT FIX COMPLETED!');
    console.log(`✅ Fixed ${fixedCount}/${issues.length} mismatches`);
    console.log('📝 Report saved to: artwork_count_fix_report.json');
    
    console.log('\n📊 FINAL ARTWORK COUNTS:');
    for (const user of users) {
      const count = await Artwork.countDocuments({ userId: user._id });
      if (count > 0) {
        console.log(`   • ${user.name}: ${count} artworks`);
      }
    }
    
    mongoose.connection.close();
    
  } catch (error) {
    console.error('💥 Error:', error.message);
    mongoose.connection.close();
  }
};

fixArtworkCounts();
