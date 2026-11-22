// src/routes/data.js
//
// Data routes extracted from server.js (Tier-S modularization):
//   POST   /api/upload        (5 MB in-memory multer + 10 / 15 min rate limit)
//   GET    /api/user/data
//   POST   /api/user/data
//   DELETE /api/user/data
//
// Behaviour, status codes, the 5 MB upload cap, the per-IP upload rate limit,
// the 20,000-book payload validation and the response shapes are all unchanged.
// The router is mounted at the app root so the full paths stay identical.
//
// author: 0xWulf
// description: Express router for CSV upload and user reading-data CRUD
// date modified: 2026-11-22

const express = require('express');
const multer = require('multer');
const path = require('path');
const rateLimit = require('express-rate-limit');
const logger = require('../logger');
const User = require('../../models/User');
const { parseGoodreadsBuffer } = require('../csv/goodreads');
const { generateStats } = require('../../shared/stats');

const router = express.Router();

// Validate a saved book array (RH-10). Returns an error string, or null.
const MAX_BOOKS = 20000;
function validateBooks(books) {
  if (!Array.isArray(books)) {
    return 'readingData must be an array';
  }
  if (books.length > MAX_BOOKS) {
    return `Too many books (max ${MAX_BOOKS})`;
  }
  for (const b of books) {
    if (b === null || typeof b !== 'object' || Array.isArray(b)) {
      return 'Each book must be an object';
    }
    if (b.title !== undefined && typeof b.title !== 'string') return 'Invalid book title';
    if (b.author !== undefined && typeof b.author !== 'string') return 'Invalid book author';
    if (b.myRating !== undefined && typeof b.myRating !== 'number') return 'Invalid book rating';
    if (b.pages !== undefined && typeof b.pages !== 'number') return 'Invalid page count';
  }
  return null;
}

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
router.post('/api/upload', uploadLimiter, (req, res) => {
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

router.get('/api/user/data', async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await User.findById(req.session.userId);
    if (!user) {
      logger.warn('User data requested but user not found in DB', { sessionUserId: String(req.session.userId) });
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

router.post('/api/user/data', async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Validate the book array before touching the database (RH-10).
    const { readingData, stats, goalProgress } = req.body;
    if (readingData !== undefined) {
      const validationError = validateBooks(readingData);
      if (validationError) {
        return res.status(400).json({ error: validationError });
      }
    }

    const user = await User.findById(req.session.userId);
    if (!user) {
      logger.warn('Attempt to post user data but user not found in DB', { sessionUserId: String(req.session.userId) });
      return res.status(404).json({ error: 'User not found' });
    }

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

router.delete('/api/user/data', async (req, res) => {
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

module.exports = router;
module.exports.validateBooks = validateBooks;
module.exports.MAX_BOOKS = MAX_BOOKS;
