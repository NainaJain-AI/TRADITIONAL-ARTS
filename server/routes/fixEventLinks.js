const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');

// POST /api/fix-event-links - Admin only route to fix event-user links
router.post('/', auth, authorize('Admin'), async (req, res) => {
  try {
    console.log('Starting event-user link fix...');

    // Get all events
    const events = await Event.find();
    console.log(`Found ${events.length} events in database`);

    if (events.length === 0) {
      return res.json({
        success: true,
        message: 'No events found to fix',
        fixed: 0,
        total: 0
      });
    }

    // Get all users
    const users = await User.find();
    console.log(`Found ${users.length} users in database`);

    if (users.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No users found in database. Cannot link events.'
      });
    }

    // Find an admin user first, or fallback to any user
    let targetUser = users.find(user => user.role === 'Admin');
    if (!targetUser) {
      // If no admin, use the first artist or any user
      targetUser = users.find(user => user.role === 'Artist') || users[0];
    }

    console.log(`Using user "${targetUser.name || targetUser.email}" (${targetUser.role}) as creator for events`);

    // Update all events to link to this user
    const updateResult = await Event.updateMany(
      {}, // Update all events
      { 
        createdBy: targetUser._id,
        isActive: true // Also ensure events are active
      }
    );

    console.log(`Updated ${updateResult.modifiedCount} events`);

    // Verify the updates by getting a few updated events
    const updatedEvents = await Event.find().populate('createdBy', 'name email role').limit(5);
    const eventStatus = updatedEvents.map((event, index) => ({
      title: event.title,
      createdBy: {
        name: event.createdBy?.name || event.createdBy?.email || 'Unknown',
        role: event.createdBy?.role || 'Unknown role'
      }
    }));

    res.json({
      success: true,
      message: '✅ Event-user linking fixed successfully!',
      fixed: updateResult.modifiedCount,
      total: events.length,
      targetUser: {
        name: targetUser.name || targetUser.email,
        role: targetUser.role
      },
      sampleEvents: eventStatus
    });

  } catch (error) {
    console.error('Error fixing event-user links:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fix event-user links',
      error: error.message
    });
  }
});

module.exports = router;
