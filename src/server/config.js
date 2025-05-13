// src/server/config.js - Server configuration
/**
 * Configuration for the server
 * Centralizes environment variables and config settings
 */
const config = {
    server: {
      port: process.env.PORT || 3001,
      environment: process.env.NODE_ENV || 'development',
      frontendUrl: process.env.FRONTEND_URL || 'http://localhost:9002',
      uploadDir: process.env.UPLOAD_DIR || 'uploads',
    },
    security: {
      sessionSecret: process.env.SESSION_SECRET || 'development-secret', 
      cookieSecret: process.env.COOKIE_SECRET || 'secure-cookie-secret',
      // Secure cookies in production, allow insecure in development
      secureCookies: process.env.NODE_ENV === 'production',
      // SameSite cookie setting
      sameSiteCookie: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      // CSRF protection settings
      csrfEnabled: true,
      // Cookie lifetimes in milliseconds
      sessionCookieMaxAge: 24 * 60 * 60 * 1000, // 24 hours
      rememberMeCookieMaxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
    database: {
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
      // Database connection string
      pgConnectionString: process.env.DATABASE_URL,
    },
    uploads: {
      maxFileSize: 10 * 1024 * 1024, // 10MB
      allowedFileTypes: ['.csv', '.txt', '.json', '.pdf', '.xlsx', '.xls'],
    },
    rateLimits: {
      // Authentication endpoints
      auth: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 10, // 10 requests per IP per window
      },
      // API endpoints
      api: {
        windowMs: 60 * 1000, // 1 minute
        max: 60, // 60 requests per IP per minute
      },
    },
  };
  
  // Validation
  const validateConfig = () => {
    const requiredVars = [
      'config.database.supabaseUrl',
      'config.database.supabaseAnonKey',
    ];
    
    const missing = [];
    
    for (const varPath of requiredVars) {
      // Use eval to check nested properties from string path
      const value = eval(varPath);
      if (!value) {
        const envVarName = varPath
          .replace('config.', '')
          .replace(/\./g, '_')
          .toUpperCase();
        missing.push(envVarName);
      }
    }
    
    if (missing.length > 0) {
      console.warn(`⚠️ Warning: Missing required environment variables: ${missing.join(', ')}`);
      
      if (process.env.NODE_ENV === 'production') {
        throw new Error(`Missing required environment variables in production: ${missing.join(', ')}`);
      }
    }
  };
  
  // Validate on import
  validateConfig();
  
  module.exports = config;