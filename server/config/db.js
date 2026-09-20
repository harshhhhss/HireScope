const mongoose = require('mongoose');

/**
 * Open the single shared MongoDB connection used by the whole app.
 * Mongoose pools connections internally, so we call this once on startup.
 */
async function connectDB() {
  // No fallback: validateEnv() has already guaranteed this is set. A default
  // here would silently connect a misconfigured deploy to a local database
  // that does not exist, which is harder to diagnose than failing outright.
  const uri = process.env.MONGO_URI;

  try {
    const conn = await mongoose.connect(uri);
    console.log(`MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
  } catch (error) {
    console.error(`MongoDB connection failed: ${error.message}`);
    // Without a database the API cannot do anything useful, so fail loudly
    // rather than serving requests that will all error.
    process.exit(1);
  }
}

module.exports = connectDB;
