const mongoose = require('mongoose');
require('dotenv').config({ path: './server/.env' });

console.log('Testing MongoDB connection...');
console.log('MONGO_URI:', process.env.MONGO_URI ? 'Set' : 'Not set');

// Test the connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected successfully!');
    console.log('Connection state:', mongoose.connection.readyState);
    console.log('Database name:', mongoose.connection.name);
    process.exit(0);
  })
  .catch(err => {
    console.log('❌ MongoDB connection failed:', err.message);
    console.log('Full error:', err);
    process.exit(1);
  });

// Set a timeout to avoid hanging
setTimeout(() => {
  console.log('⏰ Connection test timed out');
  process.exit(1);
}, 10000);
