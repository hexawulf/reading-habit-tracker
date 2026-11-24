// Unit tests for the loopback Mongo URI guard and the SESSION_SECRET guard.
// This file is not a DB suite: it never connects and never calls deleteMany.
const path = require('path');
const { spawnSync } = require('child_process');
const {
  assertSafeTestMongoUri,
  assertSessionSecret,
  ATLAS_WIPE_WARNING,
} = require('../src/safety');

describe('assertSafeTestMongoUri', () => {
  const originalEnv = process.env.NODE_ENV;
  const silence = () => jest.spyOn(console, 'error').mockImplementation(() => {});

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    jest.restoreAllMocks();
  });

  test('accepts loopback mongodb:// URIs when not in production', () => {
    process.env.NODE_ENV = 'test';
    expect(() => assertSafeTestMongoUri('mongodb://127.0.0.1:27017/jest')).not.toThrow();
    expect(() => assertSafeTestMongoUri('mongodb://localhost:27017/jest')).not.toThrow();
    expect(() => assertSafeTestMongoUri('mongodb://[::1]:27017/jest')).not.toThrow();
    expect(() => assertSafeTestMongoUri('mongodb://127.0.0.1:27017,localhost:27018/jest')).not.toThrow();
  });

  test('rejects production NODE_ENV even for a loopback URI', () => {
    const spy = silence();
    expect(() => assertSafeTestMongoUri('mongodb://127.0.0.1:27017/jest', { nodeEnv: 'production' }))
      .toThrow(/NODE_ENV is production.*Production Atlas data would be deleted/);
    expect(spy).toHaveBeenCalled();
  });

  test('rejects missing URIs, mongodb+srv, and non-loopback hosts', () => {
    const spy = silence();
    process.env.NODE_ENV = 'test';
    expect(() => assertSafeTestMongoUri(undefined)).toThrow(/MONGO_URI is missing/);
    expect(() => assertSafeTestMongoUri('mongodb+srv://cluster.example.net/app')).toThrow(ATLAS_WIPE_WARNING);
    expect(() => assertSafeTestMongoUri('mongodb://8.8.8.8:27017/app')).toThrow(ATLAS_WIPE_WARNING);
    expect(() => assertSafeTestMongoUri('mongodb://127.0.0.1.example.net:27017/app')).toThrow(ATLAS_WIPE_WARNING);
    expect(() => assertSafeTestMongoUri('mongodb://127.0.0.1:27017,db.example.net:27017/app')).toThrow(ATLAS_WIPE_WARNING);
    expect(spy).toHaveBeenCalled();
  });
});

describe('assertSessionSecret', () => {
  test('accepts a non-empty value and throws when unset or empty', () => {
    expect(() => assertSessionSecret('test-session-secret')).not.toThrow();
    expect(() => assertSessionSecret('')).toThrow('SESSION_SECRET is not set');
    const previous = process.env.SESSION_SECRET;
    delete process.env.SESSION_SECRET;
    try {
      expect(() => assertSessionSecret()).toThrow('SESSION_SECRET is not set');
    } finally {
      process.env.SESSION_SECRET = previous;
    }
  });
});

describe('connectMongo test-mode guard', () => {
  test('refuses a non-loopback URI when NODE_ENV is test', async () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const app = require('../server.js');
    await expect(app.connectMongo('mongodb+srv://cluster.example.net/app'))
      .rejects.toThrow(ATLAS_WIPE_WARNING);
    spy.mockRestore();
  });
});

describe('server.js session secret at load', () => {
  test('requiring server.js throws if SESSION_SECRET is empty', () => {
    // Empty string is already set, so dotenv.config() will not override it
    // from a local .env (dotenv does not override existing keys).
    const result = spawnSync(
      process.execPath,
      ['-e', `
        process.env.SESSION_SECRET = '';
        process.env.NODE_ENV = 'test';
        try {
          require(${JSON.stringify(path.join(__dirname, '../server.js'))});
          process.exit(2);
        } catch (err) {
          if (err && err.message === 'SESSION_SECRET is not set') process.exit(0);
          process.exit(1);
        }
      `],
      {
        env: { ...process.env, SESSION_SECRET: '', NODE_ENV: 'test' },
        encoding: 'utf8',
      },
    );
    expect(result.status).toBe(0);
  });
});
