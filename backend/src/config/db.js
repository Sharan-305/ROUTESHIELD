/**
 * RouteShield — Database Connection Manager
 */

const mongoose = require('mongoose');
const config = require('./index');

let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    return;
  }

  try {
    const conn = await mongoose.connect(config.mongodb.uri, {
      serverSelectionTimeoutMS: 5000,
      autoIndex: true // Ensure 2dsphere indexes are built
    });

    isConnected = true;
    console.log(`[MongoDB] Connected successfully: ${conn.connection.host}/${conn.connection.name}`);

    mongoose.connection.on('error', (err) => {
      console.error(`[MongoDB] Runtime error: ${err.message}`);
      isConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('[MongoDB] Disconnected from database.');
      isConnected = false;
    });

    return conn;
  } catch (error) {
    console.warn(`[MongoDB] Notice: Could not connect to MongoDB at ${config.mongodb.uri}.`);
    console.warn(`[MongoDB] Reason: ${error.message}`);
    console.warn('[MongoDB] Geocoding and routing endpoints remain fully functional without database.');
    isConnected = false;
  }
};

const getDBStatus = () => ({
  connected: isConnected,
  readyState: mongoose.connection.readyState
});

module.exports = {
  connectDB,
  getDBStatus
};
