require('dotenv').config();
const logger = require('./src/logger');
const { assertSafeTestMongoUri, assertSessionSecret } = require('./src/safety');

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const helmet = require('helmet');
const { initializeApp, cert, getApps } = require('firebase-admin/app');
const path = require('path');

const authRoutes = require('./src/routes/auth');
const dataRoutes = require('./src/routes/data');

logger.info('✅ Winston logger initialized – startup check');


// Initialize Firebase Admin. Pulled into a function so importing this module
// for tests does not require real credentials or call process.exit.
function initFirebase() {
  if (getApps().length) return;
  const serviceAccount = {
    type: process.env.FIREBASE_TYPE,
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: process.env.FIREBASE_AUTH_URI,
    token_uri: process.env.FIREBASE_TOKEN_URI,
    auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
    client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL
  };

  initializeApp({
    credential: cert(serviceAccount)
  });
  logger.info('Firebase Admin initialized successfully');
}

// Connect to MongoDB. Also pulled into a function; tests inject an in-memory
// database and never read MONGO_URI from .env.
let resolveClient;
const clientPromise = new Promise((resolve) => { resolveClient = resolve; });

async function connectMongo(uri) {
  const mongoURI = uri || process.env.MONGO_URI;
  if (!mongoURI) {
    throw new Error('MONGO_URI environment variable is not set');
  }
  // Tests (Jest workers or NODE_ENV=test) may only connect to a loopback URI.
  if (process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID) {
    assertSafeTestMongoUri(mongoURI);
  }
  mongoose.set('strictQuery', false);
  await mongoose.connect(mongoURI, {
    retryWrites: true,
    serverSelectionTimeoutMS: 5000
  });
  resolveClient(mongoose.connection.getClient());
  // Wait for connect-mongo to finish opening the sessions collection and
  // creating its TTL index before returning, so fast test suites cannot
  // disconnect mongoose while createIndex() is still in flight.
  await sessionStore.collectionP;
  logger.info('Connected to MongoDB');
}

const app = express();

// Behind nginx (production), trust the first proxy so secure cookies work and
// express-rate-limit / req.ip see the real client address.
app.set('trust proxy', 1);
app.disable('x-powered-by');

// Security headers (RH-12). The CSP allows the Firebase Google sign-in popup
// (apis.google.com, accounts.google.com, the Firebase auth domain) and the
// XHR/WebSocket endpoints the Firebase SDK uses.
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", 'https://apis.google.com', 'https://www.gstatic.com'],
      connectSrc: ["'self'", 'https://*.googleapis.com', 'https://securetoken.googleapis.com', 'https://identitytoolkit.googleapis.com'],
      frameSrc: ["'self'", 'https://*.firebaseapp.com', 'https://accounts.google.com'],
      imgSrc: ["'self'", 'data:', 'https:'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      objectSrc: ["'none'"],
    },
  },
  // Let the Google popup communicate back to the opener.
  crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
}));

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '2mb' }));
const sessionStore = MongoStore.create({
  // Reuse the mongoose connection so tests and production share one client.
  clientPromise,
  ttl: 14 * 24 * 60 * 60 // Session TTL of 14 days
});

assertSessionSecret();
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: sessionStore,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 24 * 7 // 1 week
  }
}));

// Application routes (mounted at the app root so /api/* paths are unchanged).
// Auth: /api/auth/{register,login,google,status,logout}
// Data: /api/upload, /api/user/data (GET/POST/DELETE)
app.use(authRoutes);
app.use(dataRoutes);

// Reading statistics come from the shared module (RH-09), so the server and
// client agree on the numbers.

// Health check endpoint (must come before static files)
app.get('/healthz', (req, res) => {
  res.status(200).json({ ok: true, timestamp: new Date().toISOString() });
});

// Serve static files from the client build directory.
// RH-11: hashed assets under /assets/ (Vite's output dir) are immutable and
// cached for a year; everything else (the HTML shell) is no-cache so a deploy
// is picked up.
const staticDir = path.join(__dirname, 'client', 'build');
app.use(express.static(staticDir, {
  etag: true,
  setHeaders: (res, filePath) => {
    const rel = path.relative(staticDir, filePath);
    if (rel.startsWith('assets' + path.sep)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    } else {
      res.setHeader('Cache-Control', 'no-cache');
    }
  }
}));

// A missing file under /assets/ must 404, not fall through to the SPA shell
// (otherwise a stale cached shell points at bundles that no longer exist).
app.get('/assets/*', (req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// SPA fallback: send index.html (no-cache) for non-API routes.
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  res.setHeader('Cache-Control', 'no-cache');
  res.sendFile(path.join(staticDir, 'index.html'));
});

// Global error handler — must be registered before listen()
app.use((err, req, res, _next) => {
  const status = err.status || err.statusCode || 500;
  // 4xx errors are client/scanner noise — log at warn to keep error logs meaningful
  if (status >= 400 && status < 500) {
    logger.warn('Client error:', { status, url: req.originalUrl, message: err.message, ip: req.ip });
  } else {
    logger.error('Unhandled server error:', {
      error: { message: err.message, stack: err.stack },
      url: req.originalUrl,
      method: req.method,
      ip: req.ip
    });
  }
  res.status(status).json({ error: err.message || 'Unexpected server error. Please try again later.' });
});

const PORT = process.env.PORT || 5003;
const HOST = process.env.HOST || '127.0.0.1';

// Boot sequence: init Firebase, connect Mongo, then listen. Kept out of module
// import so tests can require the app without credentials or a live database.
async function start() {
  // Fail fast on missing required secrets/config (RH-12).
  if (!process.env.SESSION_SECRET) {
    logger.error('SESSION_SECRET is not set');
    process.exit(1);
  }
  if (!process.env.MONGO_URI) {
    logger.error('MONGO_URI is not set');
    process.exit(1);
  }
  try {
    initFirebase();
  } catch (error) {
    logger.error('Error initializing Firebase Admin:', { error });
    process.exit(1);
  }
  try {
    await connectMongo();
  } catch (err) {
    logger.error('MongoDB connection error:', { error: err });
    process.exit(1);
  }
  return app.listen(PORT, HOST, () => {
    logger.info(`Server running on port ${PORT}`);
  });
}

if (require.main === module) {
  start();
}

module.exports = app; // For testing purposes
module.exports.start = start;
module.exports.initFirebase = initFirebase;
module.exports.connectMongo = connectMongo;
module.exports.sessionStore = sessionStore;
