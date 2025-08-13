const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');

// Get current user profile with detailed info
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        coverImage: user.coverImage,
        portfolioUrl: user.portfolioUrl,
        socialLinks: user.socialLinks || {},
        bio: user.bio,
        location: user.location,
        specialization: user.specialization,
        role: user.role,
        likes: user.likes,
        following: user.following,
        bookmarks: user.bookmarks,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch user profile', error: error.message });
  }
};

// Get public profile of another user
const getPublicProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId)
      .select('-password -email -resetPasswordToken -resetPasswordExpire -emailVerificationToken');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if current user follows this user
    const currentUser = await User.findById(req.user.userId);
    const isFollowing = currentUser.following.includes(userId);

    res.status(200).json({
      user: {
        id: user._id,
        name: user.name,
        avatar: user.avatar,
        following: user.following,
        followersCount: await User.countDocuments({ following: userId }),
        createdAt: user.createdAt
      },
      isFollowing
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch user profile', error: error.message });
  }
};


// Like/Unlike artwork
const toggleLike = async (req, res) => {
  try {
    const { artworkId } = req.params;
    const userId = req.user.userId;

    if (!artworkId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Artwork ID is required' 
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    const isLiked = user.likes.some(id => id.toString() === artworkId);

    if (isLiked) {
      // Unlike
      user.likes = user.likes.filter(id => id.toString() !== artworkId);
      await user.save();
      res.status(200).json({ 
        success: true, 
        message: 'Unliked successfully', 
        isLiked: false 
      });
    } else {
      // Like
      user.likes.push(artworkId);
      await user.save();
      res.status(200).json({ 
        success: true, 
        message: 'Liked successfully', 
        isLiked: true 
      });
    }
  } catch (error) {
    console.error('Error toggling like:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to toggle like', 
      error: error.message 
    });
  }
};

// Bookmark/Unbookmark artwork
const toggleBookmark = async (req, res) => {
  try {
    const { artworkId } = req.params;
    const userId = req.user.userId;

    if (!artworkId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Artwork ID is required' 
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    const isBookmarked = user.bookmarks.some(id => id.toString() === artworkId);

    if (isBookmarked) {
      // Remove bookmark
      user.bookmarks = user.bookmarks.filter(id => id.toString() !== artworkId);
      await user.save();
      res.status(200).json({ 
        success: true, 
        message: 'Bookmark removed successfully', 
        isBookmarked: false 
      });
    } else {
      // Add bookmark
      user.bookmarks.push(artworkId);
      await user.save();
      res.status(200).json({ 
        success: true, 
        message: 'Bookmarked successfully', 
        isBookmarked: true 
      });
    }
  } catch (error) {
    console.error('Error toggling bookmark:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to toggle bookmark', 
      error: error.message 
    });
  }
};

// Get user's bookmarked artworks
const getBookmarks = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const user = await User.findById(userId)
      .populate({
        path: 'bookmarks',
        populate: {
          path: 'artist',
          select: 'name avatar'
        }
      });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      bookmarks: user.bookmarks,
      count: user.bookmarks.length
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch bookmarks', error: error.message });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg });
  }

  try {
    const { name, avatar, portfolioUrl, socialLinks, bio, location, specialization } = req.body;
    const userId = req.user.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update basic fields
    if (name) user.name = name;
    if (avatar !== undefined) user.avatar = avatar;
    if (portfolioUrl !== undefined) user.portfolioUrl = portfolioUrl;
    if (bio !== undefined) user.bio = bio;
    if (location !== undefined) user.location = location;
    if (specialization !== undefined) user.specialization = specialization;

    // Update social links
    if (socialLinks && typeof socialLinks === 'object') {
      if (!user.socialLinks) {
        user.socialLinks = {};
      }
      if (socialLinks.instagram !== undefined) user.socialLinks.instagram = socialLinks.instagram;
      if (socialLinks.twitter !== undefined) user.socialLinks.twitter = socialLinks.twitter;
      if (socialLinks.website !== undefined) user.socialLinks.website = socialLinks.website;
      if (socialLinks.behance !== undefined) user.socialLinks.behance = socialLinks.behance;
      if (socialLinks.linkedin !== undefined) user.socialLinks.linkedin = socialLinks.linkedin;
      if (socialLinks.youtube !== undefined) user.socialLinks.youtube = socialLinks.youtube;
    }

    await user.save();

    res.status(200).json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        portfolioUrl: user.portfolioUrl,
        socialLinks: user.socialLinks,
        bio: user.bio,
        location: user.location,
        specialization: user.specialization,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Failed to update profile', error: error.message });
  }
};

// Change password
const changePassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg });
  }

  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to change password', error: error.message });
  }
};

// Delete account
const deleteAccount = async (req, res) => {
  try {
    const { password } = req.body;
    const userId = req.user.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify password before deletion
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Password is incorrect' });
    }

    // Remove user from other users' follows
    await User.updateMany(
      { following: userId },
      { $pull: { following: userId } }
    );

    // Delete the user account
    await User.findByIdAndDelete(userId);

    res.status(200).json({ message: 'Account deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete account', error: error.message });
  }
};

// Get user statistics
const getUserStats = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const followersCount = await User.countDocuments({ followers: userId });
    
    // Get actual artworks count for this user
    const Artwork = require('../models/Artwork');
    const userArtworksCount = await Artwork.countDocuments({ userId: userId, isActive: true });

    res.status(200).json({
      stats: {
        likesCount: user.likes ? user.likes.length : 0,
        followingCount: user.following ? user.following.length : 0,
        followersCount: followersCount,
        bookmarksCount: user.bookmarks ? user.bookmarks.length : 0,
        artworksCount: userArtworksCount,
        joinedDate: user.createdAt
      }
    });
  } catch (error) {
    console.error('Error getting user stats:', error);
    res.status(500).json({ message: 'Failed to get user stats', error: error.message });
  }
};

// Get user activity (likes, bookmarks, artworks)
const getUserActivity = async (req, res) => {
  try {
    const userId = req.user.userId;
    const Artwork = require('../models/Artwork');
    
    const user = await User.findById(userId)
      .populate({
        path: 'likes',
        model: 'Artwork',
        select: 'title imageUrl artist createdAt category',
        options: { sort: { createdAt: -1 }, limit: 10 }
      })
      .populate({
        path: 'bookmarks', 
        model: 'Artwork',
        select: 'title imageUrl artist createdAt category',
        options: { sort: { createdAt: -1 }, limit: 10 }
      });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get user's own artworks
    const userArtworks = await Artwork.find({ userId: userId, isActive: true })
      .select('title imageUrl createdAt category isPublic')
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({
      activity: {
        likedArtworks: user.likes || [],
        bookmarkedArtworks: user.bookmarks || [],
        myArtworks: userArtworks || [],
        totalLikes: user.likes?.length || 0,
        totalBookmarks: user.bookmarks?.length || 0,
        totalArtworks: userArtworks?.length || 0
      }
    });
  } catch (error) {
    console.error('Error fetching user activity:', error);
    res.status(500).json({ message: 'Failed to get user activity', error: error.message });
  }
};

// Admin-only functions
// Get all users for admin management
const getAllUsers = async (req, res) => {
  try {
    // Check if user is admin
    const currentUser = await User.findById(req.user.userId);
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (currentUser.role !== 'Admin') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    const { page = 1, limit = 10, search = '', role = '' } = req.query;
    const skip = (page - 1) * limit;

    // Build filter query
    let filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (role && role !== 'all') {
      filter.role = role;
    }

    const users = await User.find(filter)
      .select('-password -resetPasswordToken -resetPasswordExpire -emailVerificationToken')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalUsers = await User.countDocuments(filter);

    res.status(200).json({
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalUsers / limit),
        totalUsers,
        hasMore: skip + users.length < totalUsers
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch users', error: error.message });
  }
};

// Create new user (admin only)
const createUser = async (req, res) => {
  try {
    // Check if user is admin
    const currentUser = await User.findById(req.user.userId);
    if (currentUser.role !== 'Admin') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    const { name, email, password, role = 'Artist' } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    // Create new user
    const newUser = await User.create({
      name,
      email,
      password,
      role,
      isEmailVerified: true // Admin-created users are auto-verified
    });

    // Return user without password
    const userResponse = await User.findById(newUser._id).select('-password');

    res.status(201).json({
      message: 'User created successfully',
      user: userResponse
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create user', error: error.message });
  }
};

// Update user role (admin only)
const updateUserRole = async (req, res) => {
  try {
    // Check if user is admin
    const currentUser = await User.findById(req.user.userId);
    if (currentUser.role !== 'Admin') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    const { userId } = req.params;
    const { role } = req.body;

    // Validate role
    const validRoles = ['Admin', 'Artist'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role. Must be Admin or Artist.' });
    }

    // Prevent admin from changing their own role
    if (userId === req.user.userId) {
      return res.status(400).json({ message: 'Cannot change your own role' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.role = role;
    await user.save();

    const updatedUser = await User.findById(userId).select('-password');

    res.status(200).json({
      message: 'User role updated successfully',
      user: updatedUser
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update user role', error: error.message });
  }
};

// Delete user (admin only)
const deleteUser = async (req, res) => {
  try {
    // Check if user is admin
    const currentUser = await User.findById(req.user.userId);
    if (currentUser.role !== 'Admin') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    const { userId } = req.params;

    // Prevent admin from deleting their own account
    if (userId === req.user.userId) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Remove user from other users' following
    await User.updateMany(
      { following: userId },
      { $pull: { following: userId } }
    );

    // Delete the user
    await User.findByIdAndDelete(userId);

    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete user', error: error.message });
  }
};

// Get user statistics for admin dashboard
const getUserStatsAdmin = async (req, res) => {
  try {
    // Check if user is admin
    const currentUser = await User.findById(req.user.userId);
    if (currentUser.role !== 'Admin') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    const totalUsers = await User.countDocuments();
    const adminUsers = await User.countDocuments({ role: 'Admin' });
    const artistUsers = await User.countDocuments({ role: 'Artist' });
    const verifiedUsers = await User.countDocuments({ isEmailVerified: true });
    const unverifiedUsers = await User.countDocuments({ isEmailVerified: false });

    // Get recent users (last 7 days)
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentUsers = await User.countDocuments({ createdAt: { $gte: oneWeekAgo } });

    res.status(200).json({
      totalUsers,
      usersByRole: {
        admin: adminUsers,
        artist: artistUsers
      },
      verificationStatus: {
        verified: verifiedUsers,
        unverified: unverifiedUsers
      },
      recentUsers
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch user statistics', error: error.message });
  }
};

// Get all artists with their public information
const getArtists = async (req, res) => {
  try {
    const { 
      featured, 
      search, 
      limit = 20, 
      page = 1,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    let filter = { role: 'Artist' };
    
    if (featured === 'true') {
      // For now, we'll consider recently joined artists as featured
      // You can add a 'featured' field to User model later
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      filter.createdAt = { $gte: oneMonthAgo };
    }
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
      ];
    }

    // Build sort object
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const skip = (page - 1) * limit;

    const artists = await User.find(filter)
      .select('-password -email -resetPasswordToken -resetPasswordExpire -emailVerificationToken -phoneNumber')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const totalArtists = await User.countDocuments(filter);

    // Import Artwork model to count actual artworks
    const Artwork = require('../models/Artwork');

    // Add computed fields with real artwork count
    const artistsWithExtras = await Promise.all(artists.map(async (artist) => {
      const artistObj = artist.toObject();
      
      // Count actual artworks for this artist from the database
      const artworkCount = await Artwork.countDocuments({ userId: artist._id, isActive: true });
      
      // Use user's artworks array length as it's already synced
      const artworksArray = artist.artworks || [];
      
      // Count followers
      const followersCount = await User.countDocuments({ following: artist._id });
      
      return {
        ...artistObj,
        isNew: artist.createdAt > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days
        followersCount,
        artworks: artworksArray, // Use the actual artworks array from user
        artworkCount,
        signatureWork: artist.avatar || 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=300&fit=crop'
      };
    }));

    res.json({
      success: true,
      data: artistsWithExtras,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalArtists / limit),
        totalArtists,
        hasNextPage: skip + artists.length < totalArtists,
        hasPrevPage: page > 1
      }
    });

  } catch (error) {
    console.error('Error fetching artists:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch artists'
    });
  }
};

// Get individual artist by ID
const getArtistById = async (req, res) => {
  try {
    const { artistId } = req.params;
    
    // Populate artist with their likes and bookmarks containing full artwork data
    const artist = await User.findById(artistId)
      .select('-password -email -resetPasswordToken -resetPasswordExpire -emailVerificationToken -phoneNumber')
      .populate({
        path: 'likes',
        model: 'Artwork',
        select: 'title description imageUrl category artform createdAt userId',
        match: { isActive: true, isPublic: true } // Only include active and public artworks
      })
      .populate({
        path: 'bookmarks',
        model: 'Artwork', 
        select: 'title description imageUrl category artform createdAt userId',
        match: { isActive: true, isPublic: true } // Only include active and public artworks
      });
    
    if (!artist) {
      return res.status(404).json({
        success: false,
        message: 'Artist not found'
      });
    }
    
    if (artist.role !== 'Artist') {
      return res.status(404).json({
        success: false,
        message: 'User is not an artist'
      });
    }
    
    // Count actual artworks and followers for this artist
    const Artwork = require('../models/Artwork');
    const actualArtworkCount = await Artwork.countDocuments({ userId: artistId, isActive: true });
    const followersCount = await User.countDocuments({ following: artistId });
    
    // Add computed fields
    const artistObj = artist.toObject();
    
    // Transform likes and bookmarks to include artwork details
    const transformedLikes = await Promise.all(
      (artist.likes || []).filter(artwork => artwork).map(async (artwork) => {
        // Get the actual artwork document to count likes and bookmarks
        const fullArtwork = await Artwork.findById(artwork._id);
        const likesCount = fullArtwork && fullArtwork.likes ? fullArtwork.likes.length : 0;
        const bookmarksCount = fullArtwork && fullArtwork.bookmarks ? fullArtwork.bookmarks.length : 0;
        
        return {
          id: artwork._id,
          title: artwork.title,
          description: artwork.description,
          imageUrl: artwork.imageUrl,
          category: artwork.category,
          artform: artwork.artform,
          likes: likesCount,
          bookmarks: bookmarksCount,
          createdAt: artwork.createdAt,
          userId: artwork.userId
        };
      })
    );
    
    const transformedBookmarks = await Promise.all(
      (artist.bookmarks || []).filter(artwork => artwork).map(async (artwork) => {
        // Get the actual artwork document to count likes and bookmarks
        const fullArtwork = await Artwork.findById(artwork._id);
        const likesCount = fullArtwork && fullArtwork.likes ? fullArtwork.likes.length : 0;
        const bookmarksCount = fullArtwork && fullArtwork.bookmarks ? fullArtwork.bookmarks.length : 0;
        
        return {
          id: artwork._id,
          title: artwork.title,
          description: artwork.description,
          imageUrl: artwork.imageUrl,
          category: artwork.category,
          artform: artwork.artform,
          likes: likesCount,
          bookmarks: bookmarksCount,
          createdAt: artwork.createdAt,
          userId: artwork.userId
        };
      })
    );
    
    const artistWithExtras = {
      ...artistObj,
      isNew: artist.createdAt > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days
      followersCount,
      artworkCount: actualArtworkCount,
      likesCount: transformedLikes.length,
      bookmarksCount: transformedBookmarks.length,
      // Replace the raw ID arrays with populated artwork data
      likes: transformedLikes,
      bookmarks: transformedBookmarks,
      signatureWork: artist.avatar || 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=300&fit=crop'
    };
    
    res.json({
      success: true,
      data: artistWithExtras
    });
    
  } catch (error) {
    console.error('Error fetching artist:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch artist'
    });
  }
};

module.exports = {
  getUserProfile,
  getPublicProfile,
  toggleLike,
  updateProfile,
  changePassword,
  deleteAccount,
  getUserStats,
  getUserActivity,
  toggleBookmark,
  getBookmarks,
  // Admin functions
  getAllUsers,
  createUser,
  updateUserRole,
  deleteUser,
  getUserStatsAdmin,
  getArtists,
  getArtistById
};
