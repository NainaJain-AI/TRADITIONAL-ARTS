const mongoose = require('mongoose');
const Report = require('./models/Report');
const User = require('./models/User');

require('dotenv').config();

const createTestReports = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Find test users
    const testUsers = await User.find({});
    console.log('Found users:', testUsers.map(u => ({ id: u._id, username: u.username, email: u.email })));

    if (testUsers.length < 2) {
      console.error('Need at least 2 test users to create reports');
      return;
    }

    const reporter = testUsers[0];
    const reportedUser = testUsers[1];

    // Create test reports
    const testReports = [
      {
        reporter: reporter._id,
        reportType: 'artist',
        reportedUser: reportedUser._id,
        reason: 'inappropriate_content',
        description: 'This user is posting inappropriate content that violates community guidelines.',
        status: 'pending'
      },
      {
        reporter: reporter._id,
        reportType: 'artist',
        reportedUser: reportedUser._id,
        reason: 'spam',
        description: 'This user is sending spam messages repeatedly.',
        status: 'pending'
      },
      {
        reporter: reportedUser._id,
        reportType: 'artist',
        reportedUser: reporter._id,
        reason: 'harassment',
        description: 'This user has been harassing other users through comments.',
        status: 'resolved',
        adminNotes: 'Reviewed and action taken. User has been warned.',
        reviewedBy: testUsers.find(u => u.role === 'Admin')?._id || reporter._id
      },
      {
        reporter: reportedUser._id,
        reportType: 'artist',
        reportedUser: reporter._id,
        reason: 'hate_speech',
        description: 'This user is posting hate speech content.',
        status: 'dismissed',
        adminNotes: 'After review, this report was found to be unfounded.',
        reviewedBy: testUsers.find(u => u.role === 'Admin')?._id || reporter._id
      }
    ];

    // Clear existing reports first
    await Report.deleteMany({});
    console.log('Cleared existing reports');

    // Create new test reports
    const createdReports = await Report.insertMany(testReports);
    console.log(`Created ${createdReports.length} test reports:`);
    
    createdReports.forEach(report => {
      console.log(`- Report ${report._id}: ${report.reason} (${report.status})`);
    });

    console.log('Test reports created successfully!');
  } catch (error) {
    console.error('Error creating test reports:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run the script
if (require.main === module) {
  createTestReports();
}

module.exports = createTestReports;
