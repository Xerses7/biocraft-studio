// src/server/routes/auth.js - Authentication routes
const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const { csrfProtection } = require('../middleware/csrf');
const {
  setAuthCookie,
  clearAuthCookies,
  validatePassword,
  generateSecureToken,
  hashToken
} = require('../utils/auth');

// Supabase client initialization
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// User signup
router.post('/signup', csrfProtection, async (req, res) => {
  const { email, password, confirmPassword } = req.body;
  
  // Validate required fields
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }
  
  // Server-side email validation
  if (!email.includes('@')) {
    return res.status(400).json({ message: 'Invalid email format' });
  }
  
  // Server-side password validation
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.valid) {
    return res.status(400).json({ message: passwordValidation.message });
  }
  
  // Check if passwords match (if confirmPassword is provided)
  if (confirmPassword !== undefined && password !== confirmPassword) {
    return res.status(400).json({ message: 'Passwords do not match' });
  }
  
  try {
    // Check if user already exists
    const { data: existingUsers } = await supabase
      .from('user_profiles')
      .select('email')
      .eq('email', email)
      .limit(1);
      
    if (existingUsers && existingUsers.length > 0) {
      return res.status(409).json({ message: 'An account with this email already exists' });
    }
    
    // Register user with Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.FRONTEND_URL || 'http://localhost:9002'}/auth/callback`,
      },
    });
    
    if (error) throw error;
    
    // Create user profile in custom table
    if (data.user) {
      await supabase
        .from('user_profiles')
        .insert([
          { 
            user_id: data.user.id, 
            email: email,
            created_at: new Date(),
            updated_at: new Date()
          }
        ]);
    }
    
    res.status(201).json({ 
      message: 'User created. Please verify your email.',
      user: data.user
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(error.status || 400).json({ 
      message: error.message || 'Error creating user account' 
    });
  }
});

// User login
router.post('/login', csrfProtection, async (req, res) => {
  const { email, password, remember = false } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw error;

    // Update last login time
    if (data.user) {
      await supabase
        .from('user_profiles')
        .update({ 
          last_login: new Date(),
          updated_at: new Date()
        })
        .match({ user_id: data.user.id });
    }
    
    // Set secure HttpOnly cookie with session data
    setAuthCookie(res, data.session, remember);

    res.json({ 
      message: 'Signed in successfully',
      session: {
        user: data.user,
        expires_in: data.session.expires_in,
        expires_at: data.session.expires_at
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(error.status || 401).json({ 
      message: error.message || 'Invalid login credentials' 
    });
  }
});

// User logout
router.post('/signout', csrfProtection, async (req, res) => {
  try {
    // Get session data from cookie
    const sessionCookie = req.cookies.auth_session;
    
    if (sessionCookie) {
      try {
        const sessionData = JSON.parse(sessionCookie);
        
        if (sessionData && sessionData.access_token) {
          // Notify Supabase about the logout
          await supabase.auth.signOut({ 
            scope: 'local' // Only sign out from this device
          });
        }
      } catch (e) {
        console.error('Error parsing session cookie during logout:', e);
      }
    }
    
    // Always clear cookies regardless of Supabase response
    clearAuthCookies(res);
    
    // Return success message
    res.json({ message: 'Signed out successfully' });
  } catch (error) {
    console.error('Signout error:', error);
    
    // Still clear cookies even if there was an error with Supabase
    clearAuthCookies(res);
    
    res.status(error.status || 500).json({ 
      message: error.message || 'Error signing out' 
    });
  }
});

// Password reset request
router.post('/reset-password', csrfProtection, async (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }
  
  try {
    // Find user
    const { data: user } = await supabase
      .from('user_profiles')
      .select('user_id')
      .eq('email', email)
      .single();
    
    if (!user) {
      // Don't reveal if user exists for security
      return res.json({ message: 'If an account exists with this email, a password reset link has been sent.' });
    }
    
    // Generate secure token
    const resetToken = generateSecureToken();
    const resetTokenHash = hashToken(resetToken);
    
    // Store token with expiration (1 hour)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);
    
    await supabase
      .from('password_reset_tokens')
      .insert([{
        user_id: user.user_id,
        token_hash: resetTokenHash,
        expires_at: expiresAt.toISOString()
      }]);
    
    // Send email with reset link
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    
    // Send email implementation...
    
    res.json({ message: 'If an account exists with this email, a password reset link has been sent.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.json({ message: 'If an account exists with this email, a password reset link has been sent.' });
  }
});

// Set new password after reset
router.post('/new-password', csrfProtection, async (req, res) => {
  const { password, token } = req.body;
  
  if (!password || !token) {
    return res.status(400).json({ message: 'Password and token are required' });
  }
  
  // Validate password
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.valid) {
    return res.status(400).json({ message: passwordValidation.message });
  }
  
  try {
    // Hash token for comparison
    const tokenHash = hashToken(token);
    
    // Find valid token
    const { data: resetToken } = await supabase
      .from('password_reset_tokens')
      .select('user_id, expires_at')
      .eq('token_hash', tokenHash)
      .single();
    
    if (!resetToken) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }
    
    // Check expiration
    if (new Date() > new Date(resetToken.expires_at)) {
      return res.status(400).json({ message: 'Token has expired' });
    }
    
    // Update password
    const { error } = await supabase.auth.admin.updateUserById(
      resetToken.user_id,
      { password }
    );
    
    if (error) throw error;
    
    // Invalidate token after use (one-time use)
    await supabase
      .from('password_reset_tokens')
      .delete()
      .eq('token_hash', tokenHash);
    
    res.json({ message: 'Password updated successfully. You can now log in with your new password.' });
  } catch (error) {
    console.error('New password error:', error);
    res.status(error.status || 400).json({ 
      message: error.message || 'Error updating password' 
    });
  }
});

// Social login - Google
router.get('/google', (req, res) => {
  const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:9002'}/auth/callback`;
  const authUrl = supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUrl
    }
  });
  res.redirect(authUrl);
});

// Social login - GitHub
router.get('/github', (req, res) => {
  const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:9002'}/auth/callback`;
  const authUrl = supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo: redirectUrl
    }
  });
  res.redirect(authUrl);
});

// OAuth callback handler
router.get('/callback', async (req, res) => {
  // This endpoint handles the OAuth callback and sets session cookies
  const { code } = req.query;
  
  if (!code) {
    return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:9002'}/auth-error?error=missing_code`);
  }
  
  try {
    // Exchange code for session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) throw error;
    
    // Set secure HttpOnly cookie with session data
    if (data && data.session) {
      setAuthCookie(res, data.session);
    }
    
    // Redirect to the frontend
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:9002'}`);
  } catch (error) {
    console.error('Auth callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:9002'}/auth-error?error=${encodeURIComponent(error.message)}`);
  }
});

// Session refresh
router.post('/refresh', async (req, res) => {
  try {
    // Get refresh token from secure cookie
    const sessionCookie = req.cookies.auth_session;
    
    if (!sessionCookie) {
      return res.status(401).json({ message: 'No active session' });
    }
    
    let sessionData;
    try {
      sessionData = JSON.parse(sessionCookie);
    } catch (e) {
      clearAuthCookies(res);
      return res.status(401).json({ message: 'Invalid session format' });
    }
    
    if (!sessionData || !sessionData.refresh_token) {
      clearAuthCookies(res);
      return res.status(401).json({ message: 'No refresh token available' });
    }
    
    // Attempt to refresh the session
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: sessionData.refresh_token
    });
    
    if (error || !data.session) {
      clearAuthCookies(res);
      throw error || new Error('Failed to refresh session');
    }
    
    // Set new session cookies
    setAuthCookie(res, data.session);
    
    // Return new session data to client (without sensitive tokens)
    res.json({
      message: 'Session refreshed successfully',
      session: {
        user: data.user,
        expires_in: data.session.expires_in,
        expires_at: data.session.expires_at
      }
    });
    
  } catch (error) {
    console.error('Session refresh error:', error);
    clearAuthCookies(res);
    res.status(error.status || 401).json({ 
      message: error.message || 'Failed to refresh authentication session' 
    });
  }
});

// CSRF token endpoint
router.get('/csrf-token', (req, res) => {
  res.status(200).json({ message: 'CSRF token set' });
});

module.exports = router;