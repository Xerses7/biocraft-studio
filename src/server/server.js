// src/server/server.js - Main application entry point
// Load environment variables based on NODE_ENV
require('dotenv').config({
  path: process.env.NODE_ENV === 'production' 
    ? '.env' 
    : '.env.development'
});
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const path = require('path');

// Import middleware
const { csrfProtection, setCSRFToken } = require('./middleware/csrf');
const securityMiddleware = require('./middleware/security');
const { authLimiter } = require('./middleware/rateLimit');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const recipeRoutes = require('./routes/recipe');
const uploadRoutes = require('./routes/upload');

// Initialize app
const app = express();
const port = process.env.PORT || 3001;

// Import database connection
const query = require('./db');

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:9002',
  credentials: true, // Allow cookies to be sent cross-origin
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  exposedHeaders: ['X-CSRF-Token'],
  maxAge: 86400 // 24 hours
};
app.use(cors(corsOptions));

// Security middleware
app.use(helmet()); // Set various security headers
app.use(cookieParser(process.env.COOKIE_SECRET || 'secure-cookie-secret')); // Parse cookies

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'development-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    httpOnly: true, // Not accessible via JavaScript
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Set CSRF token for all requests
app.use(setCSRFToken);

// Parse JSON request body
app.use(express.json());

// Apply custom security headers
app.use(securityMiddleware);

// Apply rate limiting to sensitive endpoints
app.use('/reset-password', authLimiter);
app.use('/login', authLimiter);

// Mount routes
app.use('/auth', authRoutes);
app.use('/user', userRoutes);
app.use('/user/recipes', recipeRoutes);
app.use('/api/upload', uploadRoutes);

// Static files (if needed)
app.use('/public', express.static(path.join(__dirname, 'public')));

// Health check endpoint
app.get('/', function(req, res) {
  try {
    console.log("Connecting to database...");
    const result = query('SELECT NOW()');
    res.json({
      status: 'healthy',
      message: 'BioCraft Studio Backend is running',
      database: 'connected',
      timestamp: result.rows[0].now
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: 'unhealthy',
      message: 'Error connecting to database',
      error: error.message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Something broke!',
    error: process.env.NODE_ENV === 'development' ? err.stack : 'Internal server error'
  });
});

// Start server
app.listen(port, () => {
  console.log(`BioCraft Studio Backend listening at http://localhost:${port}`);
});