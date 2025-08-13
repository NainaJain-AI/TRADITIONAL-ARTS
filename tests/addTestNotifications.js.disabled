const mongoose = require('mongoose');
const User = require('./models/User');

require('dotenv').config();

async function addTestNotifications() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/kala-sangam');
    console.log('Connected to MongoDB');

    // Get all users
    const users = await User.find();
    console.log(`Found ${users.length} users`);

    if (users.length < 2) {
      console.log('Need at least 2 users to create test notifications');
      return;
    }

    // Create test notifications for each user
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      const fromUser = users[(i + 1) % users.length]; // Next user in the list (circular)
      
      // Clear existing notifications first
      user.notifications = [];
      
      // Add some test notifications
      const testNotifications = [
        {
          type: 'follow',
          from: fromUser._id,
          message: `${fromUser.name} started following you`,
          read: false,
          createdAt: new Date(Date.now() - 2 * 60 * 1000) // 2 minutes ago
        },
        {
          type: 'like',
          from: fromUser._id,
          message: `${fromUser.name} liked your artwork`,
          read: false,
          createdAt: new Date(Date.now() - 5 * 60 * 1000) // 5 minutes ago
        },
        {
          type: 'artwork_upload',
          from: fromUser._id,
          message: `${fromUser.name} uploaded a new artwork`,
          read: true,
          createdAt: new Date(Date.now() - 60 * 60 * 1000) // 1 hour ago
        }
      ];

      // Add notifications to user
      user.notifications.push(...testNotifications);
      
      await user.save();
      
      const unreadCount = testNotifications.filter(n => !n.read).length;
      console.log(`Added ${testNotifications.length} notifications to ${user.name} (${unreadCount} unread)`);
    }

    // Verify notifications were added
    console.log('\n=== VERIFICATION ===');
    const usersWithNotifications = await User.find({ 'notifications.0': { $exists: true } });
    
    for (const user of usersWithNotifications) {
      const unreadCount = user.notifications.filter(n => !n.read).length;
      console.log(`${user.name}: ${user.notifications.length} total notifications, ${unreadCount} unread`);
    }

    console.log('\n✅ Test notifications added successfully!');

  } catch (error) {
    console.error('Error adding test notifications:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

// Run the script
addTestNotifications();
