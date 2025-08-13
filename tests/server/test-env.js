const path = require('path');

// Load environment variables based on NODE_ENV (same as server.js)
if (process.env.NODE_ENV === 'production') {
  require("dotenv").config({ path: __dirname + '/.env.production' });
} else {
  require("dotenv").config({ path: __dirname + '/.env' });
}

console.log('=== Environment Variable Test ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('MONGO_URI:', process.env.MONGO_URI);
console.log('');

// Parse the MongoDB URI to show the database name
if (process.env.MONGO_URI) {
  const uri = process.env.MONGO_URI;
  const match = uri.match(/mongodb\+srv:\/\/[^\/]+\/([^?]+)/);
  if (match) {
    console.log('Database name from URI:', match[1]);
  } else {
    console.log('Could not parse database name from URI');
  }
}

// Test actual MongoDB connection
const mongoose = require('mongoose');

async function testConnection() {
  try {
    console.log('Testing MongoDB connection...');
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to:', conn.connection.host);
    console.log('📊 Database name:', conn.connection.name);
    console.log('🔗 Connection string parsed correctly');
    
    // Close connection
    await mongoose.connection.close();
    console.log('Connection test completed');
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
  }
}

testConnection();
