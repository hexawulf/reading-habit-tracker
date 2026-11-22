// e2e/start-test-server.mjs
//
// Boot the real Express server (server.js) for Playwright E2E runs, backed by
// an ephemeral in-memory MongoDB (mongodb-memory-server, already a dev dep).
// This exercises the genuine server.js boot path — session store, Helmet/CSP,
// rate limiting, static serving of client/build and the SPA fallback — without
// touching any real database, credentials, or user data.
//
// server.js reads MONGO_URI + SESSION_SECRET from the environment and binds to
// HOST:PORT. We set PORT=5093 (E2E) and never production values.
//
// author: 0xWulf
// description: in-memory-Mongo bootstrap for the E2E server
// date modified: 2026-11-22

import { MongoMemoryServer } from 'mongodb-memory-server';
import { createRequire } from 'node:module';
import { generateKeyPairSync } from 'node:crypto';

const require = createRequire(import.meta.url);

const PORT = process.env.MYBOOKS_E2E_PORT || '5093';

// Build a syntactically valid but entirely fake Firebase service account so
// server.js initFirebase() (which calls cert(...)) succeeds during E2E. The
// smoke suite never verifies a Google ID token, so these credentials are never
// used to contact Google — they only let the boot sequence complete. The RSA
// key is generated fresh in memory on every run; nothing is persisted.
function setFakeFirebaseEnv() {
  const { privateKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    publicKeyEncoding: { type: 'spki', format: 'pem' },
  });
  process.env.FIREBASE_TYPE = 'service_account';
  process.env.FIREBASE_PROJECT_ID = 'mybooks-e2e-fake';
  process.env.FIREBASE_PRIVATE_KEY_ID = 'e2e-fake-key-id';
  // server.js replaces literal "\n" with real newlines; the PEM already has
  // real newlines, so pass it through unchanged.
  process.env.FIREBASE_PRIVATE_KEY = privateKey;
  process.env.FIREBASE_CLIENT_EMAIL = 'e2e@mybooks-e2e-fake.iam.gserviceaccount.com';
  process.env.FIREBASE_CLIENT_ID = '000000000000000000000';
  process.env.FIREBASE_AUTH_URI = 'https://accounts.google.com/o/oauth2/auth';
  process.env.FIREBASE_TOKEN_URI = 'https://oauth2.googleapis.com/token';
  process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL = 'https://www.googleapis.com/oauth2/v1/certs';
  process.env.FIREBASE_CLIENT_X509_CERT_URL = 'https://www.googleapis.com/robot/v1/metadata/x509/e2e%40mybooks-e2e-fake.iam.gserviceaccount.com';
}

async function main() {
  const mongod = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongod.getUri();
  process.env.SESSION_SECRET = 'e2e-test-session-secret';
  process.env.PORT = PORT;
  process.env.HOST = '127.0.0.1';
  // NODE_ENV stays non-production so the secure-cookie flag does not require
  // HTTPS on the loopback test server.
  process.env.NODE_ENV = process.env.NODE_ENV === 'production' ? 'test' : (process.env.NODE_ENV || 'test');
  setFakeFirebaseEnv();

  const server = require('../server.js');
  const httpServer = await server.start();

  const shutdown = async () => {
    try {
      await new Promise((resolve) => httpServer.close(resolve));
    } catch { /* ignore */ }
    try {
      await mongod.stop();
    } catch { /* ignore */ }
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  console.log(`[e2e] test server listening on http://127.0.0.1:${PORT}`);
}

main().catch((err) => {
  console.error('[e2e] failed to start test server:', err);
  process.exit(1);
});
