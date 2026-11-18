// Per-file test setup. One in-memory MongoDB is started once for the whole run
// in tests/globalSetup.js; each DB-using file just connects mongoose to it.
// Tests never touch MONGO_URI from .env or any production database.
const mongoose = require('mongoose');

// Pure unit tests (e.g. the shared stats module) do not touch the database or
// require server.js, so they skip the connection entirely.
const DB_SUITES = [
  'auth.test.js',
  'user-data.test.js',
  'security-hotfix.test.js',
  'hardening.test.js',
  'static.test.js',
];

const testPath = expect.getState().testPath || '';
const needsDb = DB_SUITES.some((name) => testPath.endsWith(name));

beforeAll(async () => {
  // Fixed test secrets so session signing is deterministic. Not real secrets.
  process.env.SESSION_SECRET = 'test-session-secret';
  process.env.NODE_ENV = 'test';
  // Quieten the Winston logger during tests.
  const logger = require('../src/logger');
  logger.transports.forEach((t) => { t.silent = true; });

  if (!needsDb) return;

  // MONGO_URI points at the shared in-memory MongoDB (globalSetup). Give each
  // Jest worker its own database inside it, so parallel files never wipe each
  // other's data in afterEach. Connect through the app's own helper so
  // connect-mongo's clientPromise resolves with this worker's client.
  const dbName = `jest_${process.env.JEST_WORKER_ID || '1'}`;
  const raw = process.env.MONGO_URI;
  const uri = raw.includes('?')
    ? raw.replace(/\/?\?/, `/${dbName}?`)
    : `${raw.replace(/\/$/, '')}/${dbName}`;
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
  // Only disconnect this worker's mongoose client; the shared in-memory MongoDB
  // is stopped once in tests/globalTeardown.js.
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
});
