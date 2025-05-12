// src/server/middleware/csrf.js
const crypto = require('crypto');

// Generate a CSRF token
function generateCSRFToken() {
  return crypto.randomBytes(64).toString('hex');
}

// Middleware to handle CSRF protection
function csrfProtection(req, res, next) {
  // Skip for GET, HEAD, OPTIONS requests
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  const clientCSRFToken = req.headers['x-csrf-token'];
  const sessionCSRFToken = req.session?.csrfToken;

  // Verify CSRF token
  if (!clientCSRFToken || !sessionCSRFToken || clientCSRFToken !== sessionCSRFToken) {
    return res.status(403).json({ message: 'CSRF token validation failed' });
  }

  next();
}

// Middleware to set initial CSRF token
function setCSRFToken(req, res, next) {
  if (!req.session.csrfToken) {
    req.session.csrfToken = generateCSRFToken();
  }
  
  // Expose token in a custom header for single-page applications
  res.setHeader('X-CSRF-Token', req.session.csrfToken);
  next();
}

module.exports = { csrfProtection, setCSRFToken, generateCSRFToken };