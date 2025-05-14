// src/server/routes/user.js - User related routes
const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const { csrfProtection } = require('../middleware/csrf');
const { authRequired } = require('../middleware/security');
const { validatePassword } = require('../utils/auth');

// Supabase client initialization
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Helper to wrap async functions for Express
const asyncHandler = fn => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Get current session
router.get('/session', asyncHandler(async (req, res) => {
  // Get session data from cookie
  const sessionCookie = req.cookies.auth_session;
  
  if (!sessionCookie) {
    return res.status(401).json({ message: 'No active session' });
  }
  
  let sessionData;
  try {
    sessionData = JSON.parse(sessionCookie);
  } catch (e) {
    // Invalid session format
    return res.status(401).json({ message: 'Invalid session format' });
  }
  
  if (!sessionData || !sessionData.access_token) {
    return res.status(401).json({ message: 'Invalid session data' });
  }
  
  // Verify token with Supabase
  const { data: userData, error: userError } = await supabase.auth.getUser(
    sessionData.access_token
  );
  
  if (userError || !userData.user) {
    // Session is invalid or expired
    return res.status(401).json({ message: 'Session expired or invalid' });
  }
  
  // Return session info (without sensitive tokens)
  return res.json({
    session: {
      user: userData.user,
      expires_in: sessionData.expires_in,
      expires_at: sessionData.expires_at
    }
  });
}));

// Get user profile
router.get('/profile', authRequired, asyncHandler(async (req, res) => {
  const sessionData = req.session.auth;
  
  // Get user from auth
  const { data: userData, error: userError } = await supabase.auth.getUser(
    sessionData.access_token
  );
  
  if (userError) {
    return res.status(401).json({ message: userError.message || 'Error retrieving user data' });
  }
  
  // Get profile from database
  const { data: profileData, error: profileError } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userData.user.id)
    .single();
  
  if (profileError && profileError.code !== 'PGRST116') {
    // PGRST116 is the "no rows returned" error, which we handle below
    return res.status(500).json({ message: profileError.message || 'Error retrieving profile data' });
  }
  
  // If no profile exists yet, create one
  if (!profileData) {
    const newProfile = {
      user_id: userData.user.id,
      email: userData.user.email,
      created_at: new Date(),
      updated_at: new Date()
    };
    
    const { data: newProfileData, error: newProfileError } = await supabase
      .from('user_profiles')
      .insert([newProfile])
      .select('*')
      .single();
    
    if (newProfileError) {
      return res.status(500).json({ message: newProfileError.message || 'Error creating profile' });
    }
    
    return res.json({ profile: newProfileData });
  }
  
  res.json({ profile: profileData });
}));

// Update user profile
router.patch('/profile', authRequired, csrfProtection, asyncHandler(async (req, res) => {
  const sessionData = req.session.auth;
  const updateData = req.body;
  
  // Remove fields that shouldn't be updated directly
  delete updateData.user_id;
  delete updateData.email;
  delete updateData.created_at;
  
  // Add updated timestamp
  updateData.updated_at = new Date();
  
  // Get user from auth
  const { data: userData, error: userError } = await supabase.auth.getUser(
    sessionData.access_token
  );
  
  if (userError) {
    return res.status(401).json({ message: userError.message || 'Error retrieving user data' });
  }
  
  // Update profile
  const { data: updatedProfile, error: updateError } = await supabase
    .from('user_profiles')
    .update(updateData)
    .match({ user_id: userData.user.id })
    .select('*')
    .single();
  
  if (updateError) {
    return res.status(500).json({ message: updateError.message || 'Error updating profile' });
  }
  
  res.json({ 
    message: 'Profile updated successfully',
    profile: updatedProfile
  });
}));

// Change password
router.post('/change-password', authRequired, csrfProtection, asyncHandler(async (req, res) => {
  const { current_password, new_password } = req.body;
  const sessionData = req.session.auth;
  
  if (!current_password || !new_password) {
    return res.status(400).json({ message: 'Current password and new password are required' });
  }
  
  // Validate new password
  const passwordValidation = validatePassword(new_password);
  if (!passwordValidation.valid) {
    return res.status(400).json({ message: passwordValidation.message });
  }
  
  // First, verify the current password by attempting to sign in
  const { data: userData, error: userError } = await supabase.auth.getUser(
    sessionData.access_token
  );
  
  if (userError) {
    return res.status(401).json({ message: userError.message || 'Error retrieving user data' });
  }
  
  const email = userData.user.email;
  
  // Verify current password
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password: current_password,
  });
  
  if (signInError) {
    return res.status(401).json({ message: 'Current password is incorrect' });
  }
  
  // Update the password
  const { error: updateError } = await supabase.auth.updateUser({
    password: new_password,
  });
  
  if (updateError) {
    return res.status(500).json({ message: updateError.message || 'Error updating password' });
  }
  
  res.json({ message: 'Password changed successfully' });
}));

// Get user basic info
router.get('/', authRequired, asyncHandler(async (req, res) => {
  const sessionData = req.session.auth;
  
  // Verify token with Supabase
  const { data, error } = await supabase.auth.getUser(sessionData.access_token);
  
  if (error) {
    return res.status(401).json({ message: error.message || 'Invalid or expired token' });
  }
  
  res.json({ 
    message: 'User retrieved',
    user: data.user
  });
}));

module.exports = router;