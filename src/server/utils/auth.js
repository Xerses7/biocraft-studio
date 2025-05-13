// src/server/utils/auth.js - Authentication utility functions
const crypto = require('crypto');

/**
 * Sets a secure authentication cookie with the session data
 * @param {Object} res - Express response object
 * @param {Object} sessionData - Session data to store
 * @param {boolean} remember - Whether to set a longer expiration (remember me)
 */
const setAuthCookie = (res, sessionData, remember = false) => {
  // Calculate expiration time
  const maxAge = remember 
    ? 7 * 24 * 60 * 60 * 1000 // 7 days if "remember me" is checked
    : 24 * 60 * 60 * 1000;    // 24 hours by default
    
  // Set secure, httpOnly cookie with the session data
  res.cookie('auth_session', JSON.stringify(sessionData), {
    httpOnly: true,                                   // Not accessible via JavaScript
    secure: process.env.NODE_ENV === 'production',    // HTTPS only in production
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    maxAge: maxAge,
    path: '/'                                         // Available across the site
  });
  
  // Also set a non-httpOnly cookie to let the frontend know authentication state
  // This does NOT contain sensitive data, just login status
  res.cookie('auth_status', JSON.stringify({ 
    isAuthenticated: true,
    userId: sessionData.user.id
  }), {
    httpOnly: false,                                  // Accessible via JavaScript
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    maxAge: maxAge,
    path: '/'
  });
};

/**
 * Clear authentication cookies
 * @param {Object} res - Express response object
 */
const clearAuthCookies = (res) => {
  res.clearCookie('auth_session', { path: '/' });
  res.clearCookie('auth_status', { path: '/' });
};

/**
 * Validate password against security requirements
 * @param {string} password - The password to validate
 * @returns {Object} - Validation result with valid flag and message
 */
const validatePassword = (password) => {
  if (!password) {
    return { valid: false, message: "Password is required" };
  }
  
  if (password.length < 6) {
    return { valid: false, message: "Password must be at least 6 characters long" };
  }
  
  // Check additional security rules
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  
  if (!(hasUpperCase && hasLowerCase && hasNumbers)) {
    return { 
      valid: false, 
      message: "Password must include at least one uppercase letter, one lowercase letter, and one number" 
    };
  }
  
  return { valid: true, message: "" };
};

/**
 * Generate secure random token
 * @param {number} bytes - Number of bytes to generate
 * @returns {string} - Hex-encoded token
 */
const generateSecureToken = (bytes = 32) => {
  return crypto.randomBytes(bytes).toString('hex');
};

/**
 * Hash a token for secure storage
 * @param {string} token - Token to hash
 * @returns {string} - Hashed token
 */
const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Extract session data from cookie
 * @param {Object} req - Express request object
 * @returns {Object|null} - Session data or null if invalid
 */
const getSessionFromCookie = (req) => {
  const sessionCookie = req.cookies.auth_session;
  
  if (!sessionCookie) {
    return null;
  }
  
  try {
    return JSON.parse(sessionCookie);
  } catch (e) {
    return null;
  }
};

module.exports = {
  setAuthCookie,
  clearAuthCookies,
  validatePassword,
  generateSecureToken,
  hashToken,
  getSessionFromCookie
};