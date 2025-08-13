const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const { body, validationResult } = require('express-validator');
const { auth, authorize } = require('../middleware/auth');

// GET /api/events - Get all events with optional filtering
router.get('/', async (req, res) => {
  try {
    const { 
      category, 
      type, 
      startDate, 
      endDate, 
      city, 
      state, 
      upcoming = 'true',
      creatorRole, // parameter to filter by creator role
      admin // admin flag to get all events regardless of creator
    } = req.query;

    // Build filter object
    let filter = { isActive: true };
    
    if (category) filter.category = category;
    if (type) filter.type = type;
    if (city) filter['location.city'] = new RegExp(city, 'i');
    if (state) filter['location.state'] = new RegExp(state, 'i');
    
    // Date filtering
    if (upcoming === 'true') {
      filter.date = { $gte: new Date() };
    } else if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    let events;
    if (admin === 'true') {
      // Admin request - get all events regardless of creator status
      events = await Event.find(filter)
        .populate('createdBy', 'name email role')
        .sort({ date: 1 })
        .limit(100);
      
      // For admin, also include events with missing/invalid createdBy
      console.log(`Admin request: Found ${events.length} events`);
    } else if (creatorRole) {
      // If filtering by creator role, populate and filter
      events = await Event.find(filter)
        .populate('createdBy', 'role')
        .sort({ date: 1 })
        .limit(100);
      
      events = events.filter(event => event.createdBy && event.createdBy.role === creatorRole);
    } else {
      // Regular request - only events with valid creators
      events = await Event.find({ ...filter, createdBy: { $exists: true, $ne: null } })
        .populate('createdBy', 'name email role')
        .sort({ date: 1 })
        .limit(100);
    }

    res.json({
      success: true,
      count: events.length,
      data: events
    });

  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch events'
    });
  }
});

// GET /api/events/:id - Get single event
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    res.json({
      success: true,
      data: event
    });

  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch event'
    });
  }
});

// POST /api/events - Create new event (for artists only)
router.post('/', auth, authorize('Artist', 'Admin'), [
  body('title')
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),
  body('type')
    .isIn(['workshop', 'event', 'exhibition', 'performance'])
    .withMessage('Type must be one of: workshop, event, exhibition, performance'),
  body('category')
    .isIn(['music', 'dance', 'art', 'crafts', 'general'])
    .withMessage('Category must be one of: music, dance, art, crafts, general'),
  body('date')
    .isISO8601()
    .withMessage('Please provide a valid date'),
  body('time')
    .notEmpty()
    .withMessage('Time is required'),
  body('location.venue')
    .trim()
    .notEmpty()
    .withMessage('Venue is required'),
  body('location.address')
    .trim()
    .notEmpty()
    .withMessage('Address is required'),
  body('location.city')
    .trim()
    .notEmpty()
    .withMessage('City is required'),
  body('location.state')
    .trim()
    .notEmpty()
    .withMessage('State is required')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const event = new Event({
      ...req.body,
      createdBy: req.user._id // Associate event with the creating artist
    });
    await event.save();

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: event
    });

  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create event'
    });
  }
});

// PUT /api/events/:id - Update event (for artists only)
router.put('/:id', auth, authorize('Artist', 'Admin'), [
  body('title')
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),
  body('type')
    .isIn(['workshop', 'event', 'exhibition', 'performance'])
    .withMessage('Type must be one of: workshop, event, exhibition, performance'),
  body('category')
    .isIn(['music', 'dance', 'art', 'crafts', 'general'])
    .withMessage('Category must be one of: music, dance, art, crafts, general'),
  body('date')
    .isISO8601()
    .withMessage('Please provide a valid date'),
  body('time')
    .notEmpty()
    .withMessage('Time is required'),
  body('location.venue')
    .trim()
    .notEmpty()
    .withMessage('Venue is required'),
  body('location.address')
    .trim()
    .notEmpty()
    .withMessage('Address is required'),
  body('location.city')
    .trim()
    .notEmpty()
    .withMessage('City is required'),
  body('location.state')
    .trim()
    .notEmpty()
    .withMessage('State is required')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check if user owns this event or is admin
    if (event.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this event'
      });
    }

    const updatedEvent = await Event.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Event updated successfully',
      data: updatedEvent
    });

  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update event'
    });
  }
});

// DELETE /api/events/:id - Delete event (for artists/admin only)
router.delete('/:id', auth, authorize('Artist', 'Admin'), async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    res.json({
      success: true,
      message: 'Event deleted successfully',
      data: event
    });

  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete event'
    });
  }
});

module.exports = router;
