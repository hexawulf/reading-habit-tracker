// Shared test setup: an in-memory MongoDB for the whole suite.
// Tests never touch MONGO_URI from .env or any production database.
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongod;

beforeAll(async () => {
  // Fixed test secrets so session signing is deterministic. Not real secrets.
  process.env.SESSION_SECRET = 'test-session-secret';
  process.env.NODE_ENV = 'test';

  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  process.env.MONGO_URI = uri;

  // Connect through the app's own helper so connect-mongo's clientPromise
  // resolves with this in-memory client.
  const app = require('../server.js');
  await app.connectMongo(uri);
});

afterEach(async () => {
  if (mongoose.connection.readyState === 1) {
    const collections = await mongoose.connection.db.collections();
    for (const c of collections) {
      await c.deleteMany({});
    }
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
});
