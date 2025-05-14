// src/server/middleware/security.js - Security related middleware
/**
 * Middleware to add security headers to all responses
 * Helps prevent common web vulnerabilities like XSS, clickjacking, etc.
 */
const securityMiddleware = (req, res, next) => {
  // Security headers to prevent various attacks
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), camera=(), microphone=()');
  
  // Content Security Policy to prevent XSS
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self'",
    "connect-src 'self'",
    "frame-ancestors 'none'"
  ];
  
  // Only set CSP in production to avoid development issues
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Content-Security-Policy', cspDirectives.join('; '));
  }
  
  next();
};

// Authentication required middleware
const authRequired = (req, res, next) => {
  // Get session data from cookie
  const sessionCookie = req.cookies.auth_session;
  
  if (!sessionCookie) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  try {
    const sessionData = JSON.parse(sessionCookie);
    
    if (!sessionData || !sessionData.access_token) {
      return res.status(401).json({ message: 'Invalid session data' });
    }
    
    // Store session in request for use in route handlers
    req.session.auth = sessionData;
    next();
  } catch (e) {
    return res.status(401).json({ message: 'Invalid session format' });
  }
};

module.exports = securityMiddleware;
module.exports.authRequired = authRequired;