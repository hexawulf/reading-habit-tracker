// src/routes/auth.js
//
// Authentication routes extracted from server.js (Tier-S modularization):
//   POST /api/auth/register
//   POST /api/auth/login
//   POST /api/auth/google
//   GET  /api/auth/status
//   POST /api/auth/logout
//
// Behaviour, status codes, validation limits, session regeneration and the
// response DTOs are unchanged. The router is mounted at the app root so the
// full "/api/auth/*" paths stay identical.
//
// author: 0xWulf
// description: Express router for the auth endpoints
// date modified: 2026-11-22

const express = require('express');
const bcrypt = require('bcrypt');
const { getApps } = require('firebase-admin/app');
const logger = require('../logger');
const User = require('../../models/User');

const router = express.Router();

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

router.post('/api/auth/register', async (req, res) => {
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
router.post('/api/auth/login', async (req, res) => {
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

router.post('/api/auth/google', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ error: 'No token provided' });
    }

    if (!getApps().length) {
      return res.status(500).json({ error: 'Firebase Admin not initialized' });
    }

    // Verify the token with Firebase Admin. The auth subpackage is required
    // lazily so simply importing this module (e.g. in Jest) never eagerly
    // loads firebase-admin/auth and its ESM-only jose dependency.
    const { getAuth } = require('firebase-admin/auth');
    const decodedToken = await getAuth().verifyIdToken(token);
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

router.get('/api/auth/status', async (req, res) => {
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
router.post('/api/auth/logout', (req, res) => {
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

module.exports = router;
module.exports.validateCredentials = validateCredentials;
