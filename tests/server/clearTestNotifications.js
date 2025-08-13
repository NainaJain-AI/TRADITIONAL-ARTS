const mongoose = require('mongoose');
const User = require('./models/User');

require('dotenv').config();

async function clearTestNotifications() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/kala-sangam');
    console.log('Connected to MongoDB');

    // Get all users with notifications
    const usersWithNotifications = await User.find({ 'notifications.0': { $exists: true } });
    console.log(`Found ${usersWithNotifications.length} users with notifications`);

    let totalCleared = 0;

    // Clear all notifications from all users
    for (const user of usersWithNotifications) {
      const notificationCount = user.notifications.length;
      user.notifications = []; // Clear all notifications
      await user.save();
      
      totalCleared += notificationCount;
      console.log(`Cleared ${notificationCount} notifications from ${user.name}`);
    }

    console.log(`\n✅ Successfully cleared ${totalCleared} total notifications from ${usersWithNotifications.length} users`);
    console.log('\nThe notification system is now clean and will only show real notifications created by user interactions.');

    // Verify all notifications are cleared
    const verification = await User.find({ 'notifications.0': { $exists: true } });
    if (verification.length === 0) {
      console.log('✅ Verification passed: No users have notifications');
    } else {
      console.log(`⚠️ Warning: ${verification.length} users still have notifications`);
    }

  } catch (error) {
    console.error('Error clearing test notifications:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

// Run the script
clearTestNotifications();
