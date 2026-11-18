// Jest config for the server-side test suite.
// Only the server (root) is tested here; the client has its own runner.
module.exports = {
  testEnvironment: 'node',
  testMatch: ['<rootDir>/tests/**/*.test.js'],
  globalSetup: '<rootDir>/tests/globalSetup.js',
  globalTeardown: '<rootDir>/tests/globalTeardown.js',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testTimeout: 30000,
  // The client tree has its own CRA/Vitest tests; do not pick them up here.
  modulePathIgnorePatterns: ['<rootDir>/client/'],
};
