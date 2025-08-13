const express = require("express");
const router = express.Router();
const Artwork = require("../models/Artwork");
const { auth } = require("../middleware/auth");
const User = require("../models/User");

// Get all public artworks with optional filters and pagination
router.get("/", async (req, res) => {
  try {
    const { 
      userId, 
      category, 
      artform, 
      search, 
      page = 1, 
      limit = 12,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    let filter = {};
    
    if (userId) {
      // When filtering by userId, show all artworks for that user (including drafts)
      filter.userId = userId;
      filter.isActive = true; // Only exclude deleted artworks
    } else {
      // For public listing, only show public and active artworks
      filter = { isPublic: true, isActive: true };
    }
    
    if (category) {
      filter.category = category;
    }
    
    if (artform) {
      filter.artform = new RegExp(artform, 'i');
    }
    
    if (search) {
      filter.$or = [
        { title: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { artist: new RegExp(search, 'i') },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query
    const artworks = await Artwork.find(filter)
      .populate('userId', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const totalCount = await Artwork.countDocuments(filter);
    const totalPages = Math.ceil(totalCount / parseInt(limit));

    // Transform data to match frontend expectations
    const transformedArtworks = artworks.map(artwork => {
      const likeCount = artwork.likes ? artwork.likes.length : 0;
      const bookmarkCount = artwork.bookmarks ? artwork.bookmarks.length : 0;
      
      return {
        _id: artwork._id,
        id: artwork._id,
        title: artwork.title,
        artist: artwork.artist,
        description: artwork.description,
        imageUrl: artwork.imageUrl,
        image: artwork.imageUrl, // Alternative field name for compatibility
        category: artwork.category,
        artform: artwork.artform,
        likes: likeCount, // Always return count as number
        bookmarks: bookmarkCount, // Always return count as number
        views: artwork.views || 0,
        likeCount: likeCount, // Keep for compatibility
        bookmarkCount: bookmarkCount, // Keep for compatibility
        comments: artwork.comments ? artwork.comments.length : 0,
        tags: artwork.tags || [],
        location: artwork.location,
        isPublic: artwork.isPublic,
        isActive: artwork.isActive,
        createdAt: artwork.createdAt,
        updatedAt: artwork.updatedAt,
        userId: artwork.userId
      };
    });

    res.json({
      success: true,
      data: transformedArtworks,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalCount,
        limit: parseInt(limit),
        hasNext: parseInt(page) < totalPages,
        hasPrev: parseInt(page) > 1
      }
    });

  } catch (error) {
    console.error("Error fetching artworks:", error);
    res.status(500).json({ success: false, message: "Failed to fetch artworks" });
  }
});

// Get single artwork by ID
router.get("/:id", async (req, res) => {
  try {
    const artwork = await Artwork.findById(req.params.id)
      .populate('userId', 'name email')
      .populate('comments.userId', 'name');

    if (!artwork) {
      return res.status(404).json({ success: false, message: "Artwork not found" });
    }

    if (!artwork.isPublic || !artwork.isActive) {
      return res.status(403).json({ success: false, message: "Artwork not accessible" });
    }

    // Transform data
    const transformedArtwork = {
      id: artwork._id,
      title: artwork.title,
      artist: artwork.artist,
      description: artwork.description,
      imageUrl: artwork.imageUrl,
      category: artwork.category,
      artform: artwork.artform,
      likes: artwork.likes.length,
      bookmarks: artwork.bookmarks.length,
      views: artwork.views || 0,
      likeCount: artwork.likeCount,
      bookmarkCount: artwork.bookmarkCount,
      comments: artwork.comments || [],
      tags: artwork.tags || [],
      location: artwork.location,
      createdAt: artwork.createdAt,
      updatedAt: artwork.updatedAt,
      userId: artwork.userId
    };

    res.json({ success: true, data: transformedArtwork });

  } catch (error) {
    console.error("Error fetching artwork:", error);
    res.status(500).json({ success: false, message: "Failed to fetch artwork" });
  }
});

// Create new artwork (requires authentication)
router.post("/", auth, async (req, res) => {
  try {
    const { title, description, imageUrl, category, artform, tags, location } = req.body;

    // Validate required fields
    if (!title || !description || !imageUrl || !category) {
      return res.status(400).json({ 
        success: false, 
        message: "Title, description, image URL, and category are required" 
      });
    }

    // Get user info
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Create new artwork
    const newArtwork = new Artwork({
      title,
      description,
      imageUrl,
      category,
      artform,
      userId: req.user.id,
      artist: user.name || user.email,
      tags: tags || [],
      location
    });

    const savedArtwork = await newArtwork.save();

    // Transform response
    const transformedArtwork = {
      id: savedArtwork._id,
      title: savedArtwork.title,
      artist: savedArtwork.artist,
      description: savedArtwork.description,
      imageUrl: savedArtwork.imageUrl,
      category: savedArtwork.category,
      artform: savedArtwork.artform,
      likes: 0,
      bookmarks: 0,
      views: 0,
      comments: 0,
      tags: savedArtwork.tags || [],
      location: savedArtwork.location,
      createdAt: savedArtwork.createdAt,
      updatedAt: savedArtwork.updatedAt,
      userId: savedArtwork.userId
    };

    res.status(201).json({ success: true, data: transformedArtwork });

  } catch (error) {
    console.error("Error creating artwork:", error);
    res.status(500).json({ success: false, message: "Failed to create artwork" });
  }
});

// Update artwork (requires authentication and ownership)
router.put("/:id", auth, async (req, res) => {
  try {
    const artwork = await Artwork.findById(req.params.id);

    if (!artwork) {
      return res.status(404).json({ success: false, message: "Artwork not found" });
    }

    // Check ownership
    if (artwork.userId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "Not authorized to update this artwork" });
    }

    const { title, description, imageUrl, category, artform, tags, location, isPublic } = req.body;

    // Update fields
    if (title) artwork.title = title;
    if (description) artwork.description = description;
    if (imageUrl) artwork.imageUrl = imageUrl;
    if (category) artwork.category = category;
    if (artform !== undefined) artwork.artform = artform;
    if (tags !== undefined) artwork.tags = tags;
    if (location !== undefined) artwork.location = location;
    if (isPublic !== undefined) artwork.isPublic = isPublic;

    const updatedArtwork = await artwork.save();

    // Transform response
    const transformedArtwork = {
      id: updatedArtwork._id,
      title: updatedArtwork.title,
      artist: updatedArtwork.artist,
      description: updatedArtwork.description,
      imageUrl: updatedArtwork.imageUrl,
      category: updatedArtwork.category,
      artform: updatedArtwork.artform,
      likes: updatedArtwork.likes ? updatedArtwork.likes.length : 0,
      bookmarks: updatedArtwork.bookmarks ? updatedArtwork.bookmarks.length : 0,
      views: updatedArtwork.views || 0,
      comments: updatedArtwork.comments ? updatedArtwork.comments.length : 0,
      tags: updatedArtwork.tags || [],
      location: updatedArtwork.location,
      createdAt: updatedArtwork.createdAt,
      updatedAt: updatedArtwork.updatedAt,
      userId: updatedArtwork.userId
    };

    res.json({ success: true, data: transformedArtwork });

  } catch (error) {
    console.error("Error updating artwork:", error);
    res.status(500).json({ success: false, message: "Failed to update artwork" });
  }
});

// Delete artwork (requires authentication and ownership or admin)
router.delete("/:id", auth, async (req, res) => {
  try {
    const artwork = await Artwork.findById(req.params.id);

    if (!artwork) {
      return res.status(404).json({ success: false, message: "Artwork not found" });
    }

    // Check ownership or admin privileges
    const isOwner = artwork.userId.toString() === req.user.id;
    const isAdmin = req.user.role === 'Admin';
    
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: "Not authorized to delete this artwork" });
    }

    // Soft delete by setting isActive to false
    artwork.isActive = false;
    await artwork.save();

    res.json({ success: true, message: "Artwork deleted successfully" });

  } catch (error) {
    console.error("Error deleting artwork:", error);
    res.status(500).json({ success: false, message: "Failed to delete artwork" });
  }
});

// Toggle like on artwork (requires authentication)
router.post("/:id/like", auth, async (req, res) => {
  try {
    const artwork = await Artwork.findById(req.params.id);
    const user = await User.findById(req.user.id);

    if (!artwork) {
      return res.status(404).json({ success: false, message: "Artwork not found" });
    }

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (!artwork.isPublic || !artwork.isActive) {
      return res.status(403).json({ success: false, message: "Artwork not accessible" });
    }

    const userId = req.user.id;
    const artworkLikeIndex = artwork.likes.indexOf(userId);
    const userLikeIndex = user.likes.indexOf(req.params.id);

    if (artworkLikeIndex > -1) {
      // Unlike - remove from both artwork and user
      artwork.likes.splice(artworkLikeIndex, 1);
      if (userLikeIndex > -1) {
        user.likes.splice(userLikeIndex, 1);
      }
    } else {
      // Like - add to both artwork and user
      artwork.likes.push(userId);
      if (userLikeIndex === -1) {
        user.likes.push(req.params.id);
      }
      
      // Create notification for artwork owner (only if it's not the same user)
      if (artwork.userId.toString() !== userId) {
        const artworkOwner = await User.findById(artwork.userId);
        if (artworkOwner) {
          artworkOwner.notifications.push({
            type: 'like',
            from: userId,
            message: `${user.name || user.email} liked your artwork "${artwork.title}"`,
            read: false
          });
          await artworkOwner.save();
        }
      }
    }

    // Save both documents
    await Promise.all([artwork.save(), user.save()]);

    res.json({ 
      success: true, 
      liked: artworkLikeIndex === -1,
      likeCount: artwork.likes.length,
      likes: artwork.likes.length // Return count for frontend compatibility
    });

  } catch (error) {
    console.error("Error toggling like:", error);
    res.status(500).json({ success: false, message: "Failed to toggle like" });
  }
});

// Toggle bookmark on artwork (requires authentication)
router.post("/:id/bookmark", auth, async (req, res) => {
  try {
    const artwork = await Artwork.findById(req.params.id);
    const user = await User.findById(req.user.id);

    if (!artwork) {
      return res.status(404).json({ success: false, message: "Artwork not found" });
    }

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (!artwork.isPublic || !artwork.isActive) {
      return res.status(403).json({ success: false, message: "Artwork not accessible" });
    }

    const userId = req.user.id;
    const artworkBookmarkIndex = artwork.bookmarks.indexOf(userId);
    const userBookmarkIndex = user.bookmarks.indexOf(req.params.id);

    if (artworkBookmarkIndex > -1) {
      // Remove bookmark - remove from both artwork and user
      artwork.bookmarks.splice(artworkBookmarkIndex, 1);
      if (userBookmarkIndex > -1) {
        user.bookmarks.splice(userBookmarkIndex, 1);
      }
    } else {
      // Add bookmark - add to both artwork and user
      artwork.bookmarks.push(userId);
      if (userBookmarkIndex === -1) {
        user.bookmarks.push(req.params.id);
      }
      
      // Create notification for artwork owner (only if it's not the same user)
      if (artwork.userId.toString() !== userId) {
        const artworkOwner = await User.findById(artwork.userId);
        if (artworkOwner) {
          artworkOwner.notifications.push({
            type: 'bookmark',
            from: userId,
            message: `${user.name || user.email} bookmarked your artwork "${artwork.title}"`,
            read: false
          });
          await artworkOwner.save();
        }
      }
    }

    // Save both documents
    await Promise.all([artwork.save(), user.save()]);

    res.json({ 
      success: true, 
      bookmarked: artworkBookmarkIndex === -1,
      bookmarkCount: artwork.bookmarks.length,
      bookmarks: artwork.bookmarks.length // Return count for frontend compatibility
    });

  } catch (error) {
    console.error("Error toggling bookmark:", error);
    res.status(500).json({ success: false, message: "Failed to toggle bookmark" });
  }
});

// Increment view count for an artwork
router.post("/:id/view", async (req, res) => {
  try {
    const artwork = await Artwork.findById(req.params.id);

    if (!artwork) {
      return res.status(404).json({ success: false, message: "Artwork not found" });
    }

    if (!artwork.isPublic || !artwork.isActive) {
      return res.status(403).json({ success: false, message: "Artwork not accessible" });
    }

    // Increment view count
    artwork.views = (artwork.views || 0) + 1;
    await artwork.save();

    res.json({ 
      success: true, 
      views: artwork.views
    });

  } catch (error) {
    console.error("Error incrementing view count:", error);
    res.status(500).json({ success: false, message: "Failed to increment view count" });
  }
});

module.exports = router;
