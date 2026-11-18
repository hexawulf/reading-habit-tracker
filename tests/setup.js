// Shared test setup: an in-memory MongoDB for the test files that need it.
// Tests never touch MONGO_URI from .env or any production database.
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

// Pure unit tests (e.g. the shared stats module) do not touch the database or
// require server.js. Starting and tearing down an in-memory MongoDB for them is
// pointless and, in CI, the teardown raced with a client a sibling file had
// already stopped (intermittent MongoClientClosedError). Only the files that
// exercise the Express app / database get a MongoDB.
const DB_SUITES = [
  'auth.test.js',
  'user-data.test.js',
  'security-hotfix.test.js',
  'hardening.test.js',
  'static.test.js',
];

const testPath = expect.getState().testPath || '';
const needsDb = DB_SUITES.some((name) => testPath.endsWith(name));

let mongod;

beforeAll(async () => {
  // Fixed test secrets so session signing is deterministic. Not real secrets.
  process.env.SESSION_SECRET = 'test-session-secret';
  process.env.NODE_ENV = 'test';
  // Quieten the Winston logger during tests.
  const logger = require('../src/logger');
  logger.transports.forEach((t) => { t.silent = true; });

  if (!needsDb) return;

  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  process.env.MONGO_URI = uri;

  // Connect through the app's own helper so connect-mongo's clientPromise
  // resolves with this in-memory client.
  const app = require('../server.js');
  await app.connectMongo(uri);
});

afterEach(async () => {
  if (needsDb && mongoose.connection.readyState === 1) {
    const collections = await mongoose.connection.db.collections();
    for (const c of collections) {
      await c.deleteMany({});
    }
  }
});

afterAll(async () => {
  if (!needsDb) return;
  // Disconnect only if still connected, so teardown never closes an already
  // closed client.
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongod) await mongod.stop();
});
