const mysql = require('mysql2/promise');
const mongoose = require('mongoose');

// MySQL Configuration
const pool = mysql.createPool({
  host: '127.0.0.1',       // MySQL server host
  user: 'ifdain_root',      // Your MySQL username
  password: 'ifda_ims@123', // Your MySQL password
  database: 'ifdain_db',    // Database name
  timezone: '+05:30'        // Set MySQL to IST
});

// MongoDB Configuration with timeout settings
const connectMongoDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/instituteDB';
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 30000,  // 30 seconds
      socketTimeoutMS: 45000,           // 45 seconds
      connectTimeoutMS: 30000,          // 30 seconds
      maxPoolSize: 10,
      minPoolSize: 1,
    });
    console.log('? MongoDB connected successfully');
  } catch (error) {
    console.error('? MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

// Export the pool directly (NO `.promise()`)
module.exports = { pool, connectMongoDB };
