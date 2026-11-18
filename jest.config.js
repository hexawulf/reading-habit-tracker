// Jest config for the server-side test suite.
// Only the server (root) is tested here; the client has its own runner.
module.exports = {
  testEnvironment: 'node',
  testMatch: ['<rootDir>/tests/**/*.test.js'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testTimeout: 30000,
  // Run test files serially. Each file starts its own in-memory MongoDB and
  // connects the shared mongoose client in setup.js; running files in parallel
  // let one file's teardown (mongoose.disconnect) close the client while
  // another was still using it, surfacing an intermittent MongoClientClosedError
  // in CI. One worker makes teardown finish before the next file loads.
  maxWorkers: 1,
  // The client tree has its own CRA/Vitest tests; do not pick them up here.
  modulePathIgnorePatterns: ['<rootDir>/client/'],
};
