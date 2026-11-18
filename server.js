require('dotenv').config();
const logger = require('./src/logger');

const express = require('express');
const multer = require('multer');
const dayjs = require('dayjs');
const customParse = require('dayjs/plugin/customParseFormat');
dayjs.extend(customParse);
const cors = require('cors');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const bcrypt = require('bcrypt');
const rateLimit = require('express-rate-limit');
const admin = require('firebase-admin');
const User = require('./models/User');
const fs = require('fs');
const path = require('path');
const csvParser = require('csv-parser');
const { generateStats } = require('./shared/stats');

const parseDate = (s)=>{ if(!s||!s.trim())return null;
  const d=dayjs(s.trim(),['YYYY/MM/DD','MM/DD/YYYY','DD/MM/YYYY','YYYY-MM-DD'],true);
  return d.isValid()?d.toDate():null; };

logger.info('✅ Winston logger initialized – startup check');


// Initialize Firebase Admin. Pulled into a function so importing this module
// for tests does not require real credentials or call process.exit.
function initFirebase() {
  if (admin.apps.length) return;
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

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
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
  mongoose.set('strictQuery', false);
  await mongoose.connect(mongoURI, {
    retryWrites: true,
    serverSelectionTimeoutMS: 5000
  });
  resolveClient(mongoose.connection.getClient());
  logger.info('Connected to MongoDB');
}

const { Readable } = require('stream');

const parseGoodreadsStream = (stream) =>
 new Promise((res,rej)=>{
  const books=[];
  stream
   .on('error',e=>rej(new Error('File read failed: '+e.message)))
   .pipe(csvParser())
   .on('data',row=>{
     if((row['Exclusive Shelf']||'').trim().toLowerCase()!=='read')return;
     books.push({
       title: row['Title']?.trim()||'(Untitled)',
       author: row['Author']?.trim()||'Unknown',
       myRating: parseInt(row['My Rating']||'0',10)||0,
       pages: parseInt(row['Number of Pages']||'0',10)||0,
       dateRead: parseDate(row['Date Read'])
     });
   })
   .on('error',e=>rej(new Error('CSV parse failed: '+e.message)))
   .on('end',()=>res(books));
});

// Parse an uploaded CSV held in memory (no file is ever written to disk).
const parseGoodreadsBuffer = (buffer) =>
  parseGoodreadsStream(Readable.from(buffer));

const app = express();

// Behind nginx (production), trust the first proxy so secure cookies work and
// express-rate-limit / req.ip see the real client address.
app.set('trust proxy', 1);
// We'll determine the port dynamically below
// const PORT = process.env.PORT || 7070;

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    // Reuse the mongoose connection so tests and production share one client.
    clientPromise,
    ttl: 14 * 24 * 60 * 60 // Session TTL of 14 days
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 24 * 7 // 1 week
  }
}));

// Auth endpoints

// Validate auth request bodies. Returns an error string, or null if valid.
// `mode` is 'register' (strict length) or 'login' (type-only, so existing
// 6+ character passwords still work).
function validateCredentials(body, mode) {
  const { username, password } = body || {};
  if (typeof username !== 'string' || typeof password !== 'string') {
    return 'Username and password are required';
  }
  if (username.length < 3 || username.length > 64) {
    return 'Username must be between 3 and 64 characters';
  }
  if (mode === 'register') {
    if (password.length < 8 || password.length > 128) {
      return 'Password must be between 8 and 128 characters';
    }
  } else {
    if (password.length < 1 || password.length > 128) {
      return 'Invalid credentials';
    }
  }
  return null;
}

app.post('/api/auth/register', async (req, res) => {
  try {
    const validationError = validateCredentials(req.body, 'register');
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }
    const { username, password } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      username,
      password: hashedPassword,
      readingData: {
        books: [],
        stats: {},
        goals: {
          yearly: 52,
          monthly: 4
        }
      }
    });

    req.session.regenerate((err) => {
      if (err) {
        logger.error('Session regenerate error on register');
        return res.status(500).json({ error: 'Registration failed. Please try again.' });
      }
      req.session.userId = user._id;
      req.session.username = user.username;
      res.json({ user: { id: user._id, name: user.username, email: user.email || null, picture: null } });
    });
  } catch (error) {
    logger.error('Registration error:', { message: error.message });
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const validationError = validateCredentials(req.body, 'login');
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }
    // Username/password login
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user || !user.password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    req.session.regenerate((err) => {
      if (err) {
        logger.error('Session regenerate error on login');
        return res.status(500).json({ error: 'Login failed. Please try again.' });
      }
      req.session.userId = user._id;
      req.session.username = user.username;
      res.json({ user: { id: user._id, name: user.username, email: user.email || null, picture: null } });
    });
  } catch (error) {
    logger.error('Login error:', { error });
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

app.post('/api/auth/google', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ error: 'No token provided' });
    }

    if (!admin.apps.length) {
      return res.status(500).json({ error: 'Firebase Admin not initialized' });
    }

    // Verify the token with Firebase Admin
    const decodedToken = await admin.auth().verifyIdToken(token);
    if (!decodedToken) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const userId = decodedToken.uid;
    logger.info('Google auth: token verified', { googleId: userId });

    let user = await User.findOne({ googleId: userId });
    if (!user) {
      // Generate unique username by appending random digits if needed
      let username = decodedToken.name || decodedToken.email;
      let uniqueUsername = username;
      let counter = 1;
      while (await User.findOne({ username: uniqueUsername })) {
        uniqueUsername = `${username}${counter}`;
        counter++;
      }

      user = await User.create({
        googleId: userId,
        username: uniqueUsername,
        email: decodedToken.email,
        readingData: {
          books: [],
          stats: {},
          goals: {
            yearly: 52,
            monthly: 4
          }
        }
      });
    }

    req.session.regenerate((err) => {
      if (err) {
        logger.error('Session regenerate error on Google auth');
        return res.status(500).json({ error: 'Authentication failed' });
      }
      // Store user info in the fresh session.
      req.session.userId = user._id;
      req.session.userPicture = decodedToken.picture || null;
      req.session.userEmail = decodedToken.email || null;
      req.session.userName = decodedToken.name || null;
      res.json({
        user: {
          id: user._id,
          name: user.username,
          email: user.email || null,
          picture: decodedToken.picture || null
        }
      });
    });
  } catch (error) {
    logger.error('Google auth error:', { message: error.message });
    res.status(500).json({ error: 'Authentication failed' });
  }
});

app.get('/api/auth/status', async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ 
        isAuthenticated: false 
      });
    }

    const user = await User.findById(req.session.userId);
    if (!user) {
      logger.warn('Auth status check: User not found in DB for session ID', { sessionUserId: req.session.userId });
      return res.status(401).json({ 
        isAuthenticated: false 
      });
    }

    res.json({
      isAuthenticated: true,
      user: {
        id: user._id,
        name: user.username,
        email: user.email,
        picture: req.session.userPicture || null,
        googleId: user.googleId || null
      }
    });
  } catch (error) {
    logger.error('Auth status error:', { message: error.message });
    res.status(500).json({ error: 'Failed to check authentication status' });
  }
});

// Logout: destroy the session and clear the cookie.
app.post('/api/auth/logout', (req, res) => {
  if (!req.session) {
    res.clearCookie('connect.sid');
    return res.json({ success: true });
  }
  req.session.destroy((err) => {
    if (err) {
      logger.error('Logout error:', { message: err.message });
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.clearCookie('connect.sid');
    res.json({ success: true });
  });
});


// Configure multer for file uploads — parse in memory, never write to disk.
const uploadSingle = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB cap
  fileFilter: (_req, file, cb) => {
    const ok = file.mimetype === 'text/csv' ||
                file.mimetype === 'application/vnd.ms-excel' ||
                path.extname(file.originalname).toLowerCase() === '.csv';
    if (ok) return cb(null, true);
    cb(new Error('Only CSV files are allowed'));
  }
}).single('file');

// Rate limit uploads: 10 per 15 minutes per IP (honours `trust proxy`).
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many uploads from this IP. Please try again later.' }
});

// API endpoint for uploading Goodreads CSV. The file is parsed from memory and
// never stored on disk. Parsed books are persisted only for a signed-in user,
// keyed by user id.
app.post('/api/upload', uploadLimiter, (req, res) => {
  uploadSingle(req, res, async (multerErr) => {
    try {
      if (multerErr) {
        logger.warn('Multer error during file upload', { message: multerErr.message });
        return res.status(400).json({ error: 'File upload failed. ' + multerErr.message });
      }
      if (!req.file || !req.file.buffer) {
        logger.warn('No file uploaded in /api/upload');
        return res.status(400).json({ error: 'No file uploaded' });
      }

      try {
        const books = await parseGoodreadsBuffer(req.file.buffer);
        if (!Array.isArray(books)) {
          logger.error('Failed to parse books data from CSV');
          throw new Error('Failed to parse books data');
        }

        const stats = generateStats(books);

        if (req.session?.userId) {
          await User.updateOne(
            { _id: req.session.userId },
            { $set: { 'readingData.books': books, 'readingData.stats': stats } }
          ).exec();
          logger.info('User data updated after CSV upload', { userId: String(req.session.userId), booksCount: books.length });
        } else {
          logger.info('Guest CSV parsed in memory', { booksCount: books.length });
        }

        return res.json({ data: { books, stats } });
      } catch (parseError) {
        logger.warn('Error parsing CSV', { message: parseError.message });
        return res.status(400).json({ error: 'Failed to parse CSV file. Please ensure it is a valid Goodreads export.' });
      }
    } catch (err) {
      logger.error('Upload processing error', { message: err.message });
      return res.status(400).json({
        error: err.message?.includes('CSV') ?
          'Invalid CSV format. Please upload a valid Goodreads export.' :
          'Failed to process file. Please try again.'
      });
    }
  });
});

// File listing endpoint
app.get('/api/files/list', async (req, res) => {
  try {
    if (!req.session.userEmail) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userDir = path.join(__dirname, 'uploads', req.session.userEmail);
    if (!fs.existsSync(userDir)) {
      return res.json({ files: [] });
    }

    const files = await fs.promises.readdir(userDir);
    const fileStats = await Promise.all(
      files.map(async (filename) => {
        const filePath = path.join(userDir, filename);
        const stats = await fs.promises.stat(filePath);
        return {
          name: filename,
          size: stats.size,
          uploadDate: stats.mtime
        };
      })
    );

    res.json({ files: fileStats });
  } catch (error) {
    logger.error('Error listing files:', { error, userEmail: req.session.userEmail });
    res.status(500).json({ error: 'Failed to list files' });
  }
});

// File deletion endpoint
app.delete('/api/files/delete/:filename', async (req, res) => {
  try {
    if (!req.session.userEmail) {
      logger.warn('Attempt to delete file without authentication');
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const filename = req.params.filename;
    const userDir = path.resolve(__dirname, 'uploads', req.session.userEmail);
    const filePath = path.resolve(userDir, filename);

    // path.resolve normalises ".." segments; verify the resolved path is still inside userDir
    if (!filePath.startsWith(userDir + path.sep) || !fs.existsSync(filePath)) {
      logger.warn('Attempt to delete non-existent or unauthorized file', { filename, userEmail: req.session.userEmail, filePath });
      return res.status(404).json({ error: 'File not found' });
    }

    await fs.promises.unlink(filePath);
    logger.info('File deleted successfully', { filename, userEmail: req.session.userEmail });
    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    logger.error('Error deleting file:', { error, filename: req.params.filename, userEmail: req.session.userEmail });
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

app.get('/api/user/data', async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await User.findById(req.session.userId);
    if (!user) {
      logger.warn('User data requested but user not found in DB', { sessionUserId: req.session.userId });
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      readingData: user.readingData.books || [],
      stats: user.readingData.stats || {},
      goals: user.readingData.goals || { yearly: 52, monthly: 4 }
    });
  } catch (err) {
    logger.error('GET /api/user/data error:', { error: err, userId: req.session.userId });
    res.status(500).json({ error: 'Failed to fetch user data' });
  }
});

app.post('/api/user/data', async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await User.findById(req.session.userId);
    if (!user) {
      logger.warn('Attempt to post user data but user not found in DB', { sessionUserId: req.session.userId });
      return res.status(404).json({ error: 'User not found' });
    }

    const { readingData, stats, goalProgress } = req.body;
    if (Array.isArray(readingData)) {
      user.readingData.books = readingData;
    }
    if (stats) {
      user.readingData.stats = stats;
    }
    if (goalProgress?.yearly?.target) {
      user.readingData.goals.yearly = goalProgress.yearly.target;
    }
    if (goalProgress?.monthly?.target) {
      user.readingData.goals.monthly = goalProgress.monthly.target;
    }

    await user.save();
    logger.info('User data saved successfully', { userId: req.session.userId });
    res.json({ success: true });
  } catch (err) {
    logger.error('POST /api/user/data error:', { error: err, userId: req.session.userId });
    res.status(500).json({ error: 'Failed to save user data' });
  }
});

app.delete('/api/user/data', async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const user = await User.findById(req.session.userId);
    if (!user) {
      logger.warn('Attempt to delete user data but user not found in DB', { sessionUserId: req.session.userId });
      return res.status(404).json({ error: 'User not found' });
    }
    user.readingData = {
      books: [],
      stats: {},
      goals: { yearly: 52, monthly: 4 }
    };
    await user.save();
    logger.info('User data deleted successfully', { userId: req.session.userId });
    res.json({ success: true });
  } catch (err) {
    logger.error('DELETE /api/user/data error:', { error: err, userId: req.session.userId });
    res.status(500).json({ error: 'Failed to delete user data' });
  }
});

// Reading statistics come from the shared module (RH-09), so the server and
// client agree on the numbers.

// Health check endpoint (must come before static files)
app.get('/healthz', (req, res) => {
  res.status(200).json({ ok: true, timestamp: new Date().toISOString() });
});

// Serve static files from the client build directory
const staticDir = path.join(__dirname, 'client', 'build');
app.use(express.static(staticDir, {
  maxAge: process.env.NODE_ENV === 'production' ? '1y' : 0,
  etag: true
}));

// SPA fallback: send index.html for non-API routes
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
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
const HOST = process.env.HOST || '0.0.0.0';

// Boot sequence: init Firebase, connect Mongo, then listen. Kept out of module
// import so tests can require the app without credentials or a live database.
async function start() {
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
