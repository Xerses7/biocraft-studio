// src/server/middleware/rateLimit.js - Rate limiting middleware
const rateLimit = require('express-rate-limit');

/**
 * Rate limiter for authentication endpoints to prevent brute force attacks
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: { message: 'Too many attempts, please try again later' }
});

/**
 * General API rate limiter
 */
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // limit each IP to 60 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later' }
});

module.exports = {
  authLimiter,
  apiLimiter
};