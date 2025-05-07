// Backend for Reading Habit Tracker
// File: server.js

const express = require('express');
const multer = require('multer');
const cors = require('cors');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const bcrypt = require('bcrypt');
const admin = require('firebase-admin');
const User = require('./models/User');

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
  console.log('Firebase Admin initialized successfully');
} catch (error) {
  console.error('Error initializing Firebase Admin:', error);
  process.exit(1);
}

// Connect to MongoDB
const mongoURI = process.env.MONGO_URI;
if (!mongoURI) {
  console.error('MONGO_URI environment variable is not set');
  process.exit(1);
}

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  retryWrites: true,
  serverSelectionTimeoutMS: 5000
}).then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    // Continue without DB for now
    console.log('Continuing without database connection...');
  });
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const net = require('net'); // Add this for the port finder

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
app.post('/api/auth/login', async (req, res) => {
  try {
    const userId = req.headers['x-replit-user-id'];
    const username = req.headers['x-replit-user-name'];

    if (!userId || !username) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    let user = await User.findOne({ replitId: userId });

    if (!user) {
      user = await User.create({
        replitId: userId,
        username: username,
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

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    req.session.userId = user._id;
    req.session.replitId = userId;
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Google Auth endpoint
// Register endpoint
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
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find user
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
    console.log('Decoded token:', decodedToken);
    
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
    console.error('Google auth error:', error);
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
    console.error('Auth status error:', error);
    res.status(500).json({ error: error.message });
  }
});


// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!req.session.userEmail) {
      return cb(new Error('User not authenticated'));
    }
    const userDir = path.join(__dirname, 'uploads', req.session.userEmail);
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }
    cb(null, userDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const safeFilename = `goodreads-${timestamp}${path.extname(file.originalname)}`;
    cb(null, safeFilename);
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    if (path.extname(file.originalname) !== '.csv') {
      return cb(new Error('Only CSV files are allowed'));
    }
    cb(null, true);
  }
});

// API endpoint for uploading Goodreads CSV
app.post('/api/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    console.log('Processing file:', req.file.path);

    // Check if file exists and is readable
    await fs.promises.access(req.file.path, fs.constants.R_OK);

    const results = await parseGoodreadsCSV(req.file.path);
    console.log('File processed successfully');

    // Generate stats before cleaning up
    const stats = generateStats(results);

    // Save stats for the user if authenticated
    if (req.session.userEmail) {
      const userStatsDir = path.join(__dirname, 'user_data', req.session.userEmail);
      if (!fs.existsSync(userStatsDir)) {
        fs.mkdirSync(userStatsDir, { recursive: true });
      }

      const statsPath = path.join(userStatsDir, 'stats.json');
      await fs.promises.writeFile(statsPath, JSON.stringify(stats, null, 2));

      // Update user in database
      if (req.session.userId) {
        await User.findByIdAndUpdate(req.session.userId, {
          'readingData.stats': stats,
          'readingData.books': results
        });
      }
    }

    return res.json({ 
      success: true, 
      stats: stats,
      data: results
    });
  } catch (error) {
    console.error('Error processing file:', error);

    // Clean up the uploaded file on error
    if (req.file && req.file.path) {
      try {
        await fs.promises.unlink(req.file.path);
      } catch (err) {
        console.error('Error deleting file during error handling:', err);
      }
    }

    return res.status(500).json({ 
      error: 'Error processing file',
      details: error.message || 'Unknown error occurred'
    });
  }
});

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
    console.error('Error listing files:', error);
    res.status(500).json({ error: 'Failed to list files' });
  }
});

// File deletion endpoint
app.delete('/api/files/delete/:filename', async (req, res) => {
  try {
    if (!req.session.userEmail) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const filename = req.params.filename;
    const userDir = path.join(__dirname, 'uploads', req.session.userEmail);
    const filePath = path.join(userDir, filename);

    // Check if file exists and is in user's directory
    if (!fs.existsSync(filePath) || !filePath.startsWith(userDir)) {
      return res.status(404).json({ error: 'File not found' });
    }

    await fs.promises.unlink(filePath);
    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

app.get('/api/stats', async (req, res) => {
  // In a production app, this would retrieve data from a database
  // For now, we'll just use the most recent upload if available
  const uploadDir = path.join(__dirname, 'uploads');
  if (!fs.existsSync(uploadDir)) {
    return res.status(404).json({ error: 'No data available' });
  }

  const files = fs.readdirSync(uploadDir);
  if (files.length === 0) {
    return res.status(404).json({ error: 'No data available' });
  }

  // Get the most recent file
  const mostRecentFile = files
    .filter(file => file.startsWith('goodreads-'))
    .sort()
    .reverse()[0];

  if (!mostRecentFile) {
    return res.status(404).json({ error: 'No data available' });
  }

  try {
    const results = await parseGoodreadsCSV(path.join(uploadDir, mostRecentFile));
    return res.json({ 
      success: true, 
      stats: generateStats(results),
      data: results
    });
  } catch (error) {
    console.error('Error retrieving stats:', error);
    return res.status(500).json({ error: 'Error retrieving stats' });
  }
});

// Function to parse Goodreads CSV
function parseGoodreadsCSV(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];

    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => {
        // Transform and clean data
        const transformedData = {
          bookId: data['Book Id'] || '',
          title: data['Title'] || '',
          author: data['Author'] || '',
          authorLastFirst: data['Author l-f'] || '',
          additionalAuthors: data['Additional Authors'] || '',
          isbn: data['ISBN'] || '',
          isbn13: data['ISBN13'] || '',
          myRating: parseInt(data['My Rating']) || 0,
          averageRating: parseFloat(data['Average Rating']) || 0,
          publisher: data['Publisher'] || '',
          binding: data['Binding'] || '',
          pages: parseInt(data['Number of Pages']) || 0,
          yearPublished: parseInt(data['Year Published']) || 0,
          originalPublicationYear: parseInt(data['Original Publication Year']) || 0,
          dateRead: data['Date Read'] ? new Date(data['Date Read']) : null,
          dateAdded: data['Date Added'] ? new Date(data['Date Added']) : null,
          bookshelves: data['Bookshelves'] || '',
          bookshelvesWithPositions: data['Bookshelves with positions'] || '',
          exclusiveShelf: data['Exclusive Shelf'] || '',
          myReview: data['My Review'] || '',
          spoiler: data['Spoiler'] || '',
          privateNotes: data['Private Notes'] || '',
          readCount: parseInt(data['Read Count']) || 0,
          ownedCopies: parseInt(data['Owned Copies']) || 0
        };

        // Only include books that have been read
        if (transformedData.exclusiveShelf === 'read' && transformedData.dateRead) {
          results.push(transformedData);
        }
      })
      .on('end', () => {
        // Sort books by date read (most recent first)
        results.sort((a, b) => {
          if (!a.dateRead) return 1;
          if (!b.dateRead) return -1;
          return b.dateRead - a.dateRead;
        });

        resolve(results);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
}

// Function to generate reading statistics
function generateStats(books) {
  if (!books || books.length === 0) {
    return {
      totalBooks: 0,
      averageRating: 0,
      totalPages: 0,
      averagePagesPerBook: 0,
      readingByYear: {},
      readingByMonth: {},
      topAuthors: [],
      ratingDistribution: {}
    };
  }

  // Total books and pages
  const totalBooks = books.length;
  const totalPages = books.reduce((sum, book) => sum + (book.pages || 0), 0);

  // Calculate average rating
  const ratingsSum = books.reduce((sum, book) => sum + (book.myRating || 0), 0);
  const averageRating = ratingsSum / books.filter(book => book.myRating > 0).length;

  // Reading history by year
  const readingByYear = {};
  books.forEach(book => {
    if (book.dateRead) {
      const year = book.dateRead.getFullYear();
      readingByYear[year] = (readingByYear[year] || 0) + 1;
    }
  });

  // Reading history by month (for the current and previous year)
  const currentYear = new Date().getFullYear();
  const readingByMonth = {};

  // Initialize all months for current and previous year
  [currentYear, currentYear - 1].forEach(year => {
    readingByMonth[year] = Array(12).fill(0);
  });

  // Count books by month
  books.forEach(book => {
    if (book.dateRead) {
      const year = book.dateRead.getFullYear();
      const month = book.dateRead.getMonth();

      if (year === currentYear || year === currentYear - 1) {
        readingByMonth[year][month] += 1;
      }
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
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([author, count]) => ({ author, count }));

  // Rating distribution
  const ratingDistribution = {};
  for (let i = 1; i <= 5; i++) {
    ratingDistribution[i] = books.filter(book => book.myRating === i).length;
  }

  // Calculate reading pace
  const readingPace = {
    currentYear: readingByYear[currentYear] || 0,
    previousYear: readingByYear[currentYear - 1] || 0,
    currentMonth: readingByMonth[currentYear][new Date().getMonth()] || 0,
    averageBooksPerMonth: calculateAverageBooksPerMonth(books)
  };

  // Recently read books
  const recentBooks = books.slice(0, 30);

  // Goal progress (assuming a goal of 52 books per year)
  const yearlyGoal = 52;
  const goalProgress = {
    target: yearlyGoal,
    current: readingByYear[currentYear] || 0,
    percentage: Math.round(((readingByYear[currentYear] || 0) / yearlyGoal) * 100)
  };

  return {
    totalBooks,
    averageRating,
    totalPages,
    averagePagesPerBook: Math.round(totalPages / totalBooks),
    readingByYear,
    readingByMonth,
    topAuthors,
    ratingDistribution,
    readingPace,
    recentBooks,
    goalProgress
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

// Start server with fixed port for Replit
const PORT = 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`✅ Server started successfully!`);
});

module.exports = app; // For testing purposes