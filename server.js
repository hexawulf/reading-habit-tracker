require('dotenv').config();
const logger = require('./src/logger'); // Import Winston logger

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
const admin = require('firebase-admin');
const User = require('./models/User');
const fs = require('fs');
const path = require('path');
const csvParser = require('csv-parser');

// Backend for Reading Habit Tracker
// File: server.js

const net = require('net'); // Add this for the port finder

dayjs.extend(customParse);

const parseDate = (s)=>{ if(!s||!s.trim())return null;
  const d=dayjs(s.trim(),['YYYY/MM/DD','MM/DD/YYYY','DD/MM/YYYY','YYYY-MM-DD'],true);
  return d.isValid()?d.toDate():null; };

logger.info('✅ Winston logger initialized – startup check');

logger.debug('🔎 DEBUG Firebase env vars:', {
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
  FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
  FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY ? '(exists)' : '(missing)',
});


// Initialize Firebase Admin
try {
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
} catch (error) {
  logger.error('Error initializing Firebase Admin:', { error });
  process.exit(1);
}

// Connect to MongoDB
const mongoURI = process.env.MONGO_URI;
if (!mongoURI) {
  logger.error('MONGO_URI environment variable is not set');
  process.exit(1);
}

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  retryWrites: true,
  serverSelectionTimeoutMS: 5000
}).then(() => logger.info('Connected to MongoDB'))
  .catch(err => {
    logger.error('MongoDB connection error:', { error: err });
    // Continue without DB for now
    logger.warn('Continuing without database connection...');
  });

const parseGoodreadsCsv = (filePath) =>
 new Promise((res,rej)=>{
  const books=[];
  fs.createReadStream(filePath)
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

const app = express();
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
    mongoUrl: mongoURI,
    ttl: 14 * 24 * 60 * 60 // Session TTL of 14 days
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60 * 24 * 7 // 1 week
  }
}));

// Auth middleware
const requireAuth = (req, res, next) => {
  const userId = req.headers['x-replit-user-id'];
  const username = req.headers['x-replit-user-name'];
  const sessionUserId = req.session.userId;

  if (!userId && !sessionUserId) {
    return res.status(401).json({ error: 'Unauthorized - Please login' });
  }

  // Add user info to request object
  req.user = {
    id: userId || sessionUserId,
    username: username || req.session.username
  };

  next();
};

// Auth endpoints
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

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

    req.session.userId = user._id;
    req.session.username = user.username;
    res.json({ user: { ...user.toJSON(), password: undefined } });
  } catch (error) {
    logger.error('Registration error:', { error, username: req.body.username });
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const replitId = req.headers['x-replit-user-id'];
    const replitName = req.headers['x-replit-user-name'];

    if (replitId && replitName) {
      // Replit login: find or create user by Replit ID
      let user = await User.findOne({ replitId });
      if (!user) {
        user = await User.create({
          replitId,
          username: replitName,
          readingData: {
            books: [],
            stats: {},
            goals: { yearly: 52, monthly: 4 }
          }
        });
      }
      // Update last login time and save session info
      user.lastLogin = new Date();
      await user.save();
      req.session.userId = user._id;
      req.session.replitId = replitId;
      return res.json({ user });
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

    req.session.userId = user._id;
    res.json({ user: { ...user.toJSON(), password: undefined } });
  } catch (error) {
    res.status(500).json({ error: error.message });
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
    logger.info('Decoded Google Auth token:', { userId, email: decodedToken.email });

    // Store additional user info in session
    req.session.userPicture = decodedToken.picture;
    req.session.userEmail = decodedToken.email;
    req.session.userName = decodedToken.name;

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

    req.session.userId = user._id;
    res.json({ user });
  } catch (error) {
    logger.error('Google auth error:', { error, tokenProvided: !!req.body.token });
    res.status(500).json({ 
      error: 'Authentication failed',
      details: error.message 
    });
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
    logger.error('Auth status error:', { error, sessionUserId: req.session.userId });
    res.status(500).json({ error: error.message });
  }
});


// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const baseDir = path.join(__dirname, 'uploads');
    const dest = req.session?.userEmail
      ? path.join(baseDir, req.session.userEmail)
      : path.join(baseDir, 'guest');
    fs.mkdir(dest, { recursive: true }, (err) => {
      if (err) {
        logger.error('Upload dir creation error:', { error: err, destination: dest });
        return cb(new Error('Upload directory error'));
      }
      cb(null, dest);
    });
  },
  filename: (req, file, cb) => {
    const ts = Date.now();
    cb(null, `goodreads-${ts}${path.extname(file.originalname)}`);
  }
});

const uploadSingle = multer({ storage }).single('file');

// API endpoint for uploading Goodreads CSV
app.post('/api/upload', (req, res) => {
  uploadSingle(req, res, async (multerErr) => {
    try {
      if (multerErr) {
        logger.error('Multer error during file upload:', { error: multerErr, file: req.file });
        return res.status(400).json({ error: 'File upload failed. ' + multerErr.message });
      }
      if (!req.file) {
        logger.warn('No file uploaded in /api/upload');
        return res.status(400).json({ error: 'No file uploaded' });
      }
      if (!req.file.path || !fs.existsSync(req.file.path)) {
        logger.error('Uploaded file not saved or path missing', { file: req.file });
        return res.status(400).json({ error: 'Upload failed – file not saved' });
      }

      try {
        const books = await parseGoodreadsCsv(req.file.path);
        if (!Array.isArray(books)) {
          logger.error('Failed to parse books data from CSV', { filePath: req.file.path });
          throw new Error('Failed to parse books data');
        }

        const stats = generateStats(books);

        if (req.session?.userId) {
          await User.updateOne(
            { _id: req.session.userId },
            { $set: { 'readingData.books': books, 'readingData.stats': stats } }
          ).exec();
          logger.info('User data updated after CSV upload', { userId: req.session.userId, booksCount: books.length });
        } else {
          logger.info('Guest CSV uploaded and parsed', { booksCount: books.length, filePath: req.file.path });
        }

        return res.json({ data: { books, stats } });
      } catch (parseError) {
        logger.error('Error parsing CSV:', { error: parseError, filePath: req.file.path });
        return res.status(400).json({ error: 'Failed to parse CSV file. Please ensure it is a valid Goodreads export.' });
      }
    } catch (err) {
      logger.error('Upload processing error:', { error: err, file: req.file });
      await cleanupFile(req.file?.path);
      return res.status(400).json({
        error: err.message?.includes('CSV') ? 
          'Invalid CSV format. Please upload a valid Goodreads export.' : 
          'Failed to process file. Please try again.'
      });
    }
  });
});

// Helper function to safely clean up uploaded files
async function cleanupFile(filePath) {
  if (filePath && fs.existsSync(filePath)) {
    try {
      await fs.promises.unlink(filePath);
      logger.info('Cleaned up uploaded file:', { filePath });
    } catch (err) {
      logger.error('Error cleaning up file:', { error: err, filePath });
    }
  }
}

// API endpoint to get reading stats without uploading
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
    const userDir = path.join(__dirname, 'uploads', req.session.userEmail);
    const filePath = path.join(userDir, filename);

    // Check if file exists and is in user's directory
    if (!fs.existsSync(filePath) || !filePath.startsWith(userDir)) {
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

app.get('/api/stats', async (req, res) => {
  // In a production app, this would retrieve data from a database
  // For now, we'll just use the most recent upload if available
  const uploadDir = path.join(__dirname, 'uploads');
  if (!fs.existsSync(uploadDir)) {
    logger.warn('/api/stats called but upload directory does not exist');
    return res.status(404).json({ error: 'No data available' });
  }

  const files = fs.readdirSync(uploadDir);
  if (files.length === 0) {
    logger.warn('/api/stats called but no files in upload directory');
    return res.status(404).json({ error: 'No data available' });
  }

  // Get the most recent file
  const mostRecentFile = files
    .filter(file => file.startsWith('goodreads-'))
    .sort()
    .reverse()[0];

  if (!mostRecentFile) {
    logger.warn('/api/stats called but no Goodreads files found in upload directory');
    return res.status(404).json({ error: 'No data available' });
  }

  try {
    const results = await parseGoodreadsCsv(path.join(uploadDir, mostRecentFile));
    logger.info('Successfully retrieved stats from most recent file', { file: mostRecentFile });
    return res.json({ 
      success: true, 
      stats: generateStats(results),
      data: results
    });
  } catch (error) {
    logger.error('Error retrieving stats from file:', { error, file: mostRecentFile });
    return res.status(500).json({ error: 'Error retrieving stats' });
  }
});



// Function to generate reading statistics
function generateStats(books) {
  const totalBooks = books.length;
  const totalPages = books.reduce((sum, book) => sum + (book.pages || 0), 0);

  // Calculate average rating
  const ratedBooks = books.filter(b => b.myRating && b.myRating > 0);
  const averageRating = ratedBooks.length 
    ? parseFloat((ratedBooks.reduce((sum, b) => sum + b.myRating, 0) / ratedBooks.length).toFixed(2))
    : 0;

  // Reading history
  const readingByYear = {};
  const readingByMonth = {};
  books.forEach(book => {
    if (book.dateRead) {
      const year = book.dateRead.getFullYear();
      const month = book.dateRead.getMonth();
      readingByYear[year] = (readingByYear[year] || 0) + 1;
      if (!readingByMonth[year]) readingByMonth[year] = Array(12).fill(0);
      readingByMonth[year][month]++;
    }
  });

  // Top authors
  const authorCounts = {};
  books.forEach(book => {
    if (book.author) {
      authorCounts[book.author] = (authorCounts[book.author] || 0) + 1;
    }
  });
  const topAuthors = Object.entries(authorCounts)
    .map(([author, count]) => ({ author, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Rating distribution
  const ratingDistribution = {1:0, 2:0, 3:0, 4:0, 5:0};
  books.forEach(book => {
    if (book.myRating > 0) {
      ratingDistribution[book.myRating]++;
    }
  });

  // Reading pace
  const readingPace = {
    booksPerYear: books.length,
    booksPerMonth: parseFloat((books.length / 12).toFixed(2)),
    pagesPerDay: parseFloat((totalPages / 365).toFixed(2))
  };

  // Page statistics
  let longestBook = { title: '', author: '', pages: 0 };
  let shortestBook = { title: '', author: '', pages: Number.MAX_SAFE_INTEGER };
  books.forEach(book => {
    if (book.pages > longestBook.pages) {
      longestBook = { title: book.title, author: book.author, pages: book.pages };
    }
    if (book.pages > 0 && book.pages < shortestBook.pages) {
      shortestBook = { title: book.title, author: book.author, pages: book.pages };
    }
  });
  if (shortestBook.pages === Number.MAX_SAFE_INTEGER) {
    shortestBook = { title: '', author: '', pages: 0 };
  }
  const averageLength = books.length ? Math.round(totalPages / books.length) : 0;

  return {
    totalBooks,
    totalPages,
    averageRating,
    readingByYear,
    readingByMonth,
    readingByGenre: {},
    topAuthors,
    ratingDistribution,
    readingPace,
    pageStats: {
      totalPages,
      averageLength,
      longestBook,
      shortestBook
    }
  };
}

// Helper function to calculate average books per month
function calculateAverageBooksPerMonth(books) {
  if (!books || books.length === 0) return 0;

  // Get unique years with at least one book read
  const yearsWithReading = new Set();
  books.forEach(book => {
    if (book.dateRead) {
      yearsWithReading.add(book.dateRead.getFullYear());
    }
  });

  // Calculate total months of active reading
  const totalMonths = yearsWithReading.size * 12;

  // Return average
  return parseFloat((books.length / totalMonths).toFixed(2));
}

// Serve static files from the client/build folder if in production
if (process.env.NODE_ENV === 'production') {
  // Serve static files
  app.use(express.static(path.join(__dirname, 'client/build')));

  // For any request that doesn't match an API route, send the index.html file
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
  });
} else {
  // In development mode, add a basic root route
  app.get('/', (req, res) => {
    res.send('Reading Habits API is running... Use the API endpoints to interact with the service or connect your frontend application.');
  });
}

// Function to find an available port
function findAvailablePort(startPort, callback) {
  const server = net.createServer();

  server.listen(startPort, () => {
    const port = server.address().port;
    server.close(() => callback(port));
  });

  server.on('error', () => {
    // Port is in use, try the next one
    findAvailablePort(startPort + 1, callback);
  });
}

// Start server with fixed port for piapps.dev
const PORT = process.env.PORT || 5003;
app.listen(PORT, '0.0.0.0', () => {
  logger.info(`Server running on port ${PORT}`);
});




// Global error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled exception in global error handler:', {
    error: {
        message: err.message,
        stack: err.stack,
        // Include any other relevant properties from the error object
        ...(typeof err === 'object' && err !== null ? err : {})
    },
    url: req.originalUrl,
    method: req.method,
    ip: req.ip
  });
  res.status(500).json({ error: 'Unexpected server error. Please try again later.' });
});

module.exports = app; // For testing purposes
