const mongoose = require('mongoose');
const { env } = require('./env');

let memoryServer = null;


async function connectDB() {
  let uri = env.mongoUri;

  if (env.useMemoryDb) {
    // Loaded lazily so production installs never need the dev dependency.
    const { MongoMemoryServer } = require('mongodb-memory-server');
    memoryServer = await MongoMemoryServer.create();
    uri = memoryServer.getUri('bugtrack');
    console.log('🧪 Using in-memory MongoDB (data resets when the server stops)');
  }

  mongoose.set('strictQuery', true);

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000,
  });

  console.log(`✅ MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`);

  if (env.autoSeed) {
    const { User } = require('../models/User');
    const hasUsers = (await User.estimatedDocumentCount()) > 0;
    if (!hasUsers) {
      console.log('🌱 Empty database detected — seeding demo data...');
      const { seedDatabase } = require('../seed');
      await seedDatabase({ silent: false });
    }
  }

  return mongoose.connection;
}

async function disconnectDB() {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = null;
  }
}

module.exports = { connectDB, disconnectDB };
