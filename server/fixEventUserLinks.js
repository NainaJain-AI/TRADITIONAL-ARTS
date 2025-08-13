const mongoose = require('mongoose');
const Event = require('./models/Event');
const User = require('./models/User');
require('dotenv').config();

async function fixEventUserLinks() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/traditional-arts');
    console.log('Connected to MongoDB');

    // Get all events
    const events = await Event.find();
    console.log(`Found ${events.length} events in database`);

    // Get all users
    const users = await User.find();
    console.log(`Found ${users.length} users in database`);

    if (users.length === 0) {
      console.error('No users found in database. Cannot link events.');
      return;
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

    // Verify the updates
    const updatedEvents = await Event.find().populate('createdBy', 'name email role');
    console.log('\nEvent status after update:');
    updatedEvents.forEach((event, index) => {
      console.log(`${index + 1}. "${event.title}" - Created by: ${event.createdBy?.name || event.createdBy?.email || 'Unknown'} (${event.createdBy?.role || 'Unknown role'})`);
    });

    // Close connection
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
    console.log('✅ Event-user linking fixed successfully!');
    
  } catch (error) {
    console.error('Error fixing event-user links:', error);
    process.exit(1);
  }
}

// Run the fixing function if this file is executed directly
if (require.main === module) {
  fixEventUserLinks();
}

module.exports = { fixEventUserLinks };
