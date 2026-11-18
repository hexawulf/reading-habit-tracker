// Start ONE in-memory MongoDB for the whole Jest run. Downloading and starting
// the mongod binary can be slow in CI; doing it once (here) rather than once
// per test file keeps every file's beforeAll fast and avoids per-file startup
// timeouts. The connection string is passed to the workers via process.env,
// which Jest propagates from globalSetup to the test environments.
const { MongoMemoryServer } = require('mongodb-memory-server');

module.exports = async () => {
  const mongod = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongod.getUri();
  // Stash the instance so globalTeardown can stop it.
  global.__MONGOD__ = mongod;
};
