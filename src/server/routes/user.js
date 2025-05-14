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

// Get current session
router.get('/session', function(req, res) {
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
  
  // Verify token with Supabase (using callback pattern)
  supabase.auth.getUser(sessionData.access_token)
    .then(({ data: userData, error: userError }) => {
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
    })
    .catch((error) => {
      console.error('Session check error:', error);
      res.status(500).json({ message: 'Error verifying session' });
    });
});

// Get user profile
router.get('/profile', authRequired, function(req, res) {
  const sessionData = req.session.auth;
  
  // Get user from auth
  supabase.auth.getUser(sessionData.access_token)
    .then(({ data: userData, error: userError }) => {
      if (userError) {
        throw userError;
      }
      
      // Get profile from database
      return supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userData.user.id)
        .single()
        .then(({ data: profileData, error: profileError }) => {
          if (profileError && profileError.code !== 'PGRST116') {
            // PGRST116 is the "no rows returned" error, which we handle below
            throw profileError;
          }
          
          // If no profile exists yet, create one
          if (!profileData) {
            const newProfile = {
              user_id: userData.user.id,
              email: userData.user.email,
              created_at: new Date(),
              updated_at: new Date()
            };
            
            return supabase
              .from('user_profiles')
              .insert([newProfile])
              .select('*')
              .single()
              .then(({ data: newProfileData, error: newProfileError }) => {
                if (newProfileError) {
                  throw newProfileError;
                }
                
                return res.json({ profile: newProfileData });
              });
          }
          
          return res.json({ profile: profileData });
        });
    })
    .catch((error) => {
      console.error('Get profile error:', error);
      res.status(error.status || 401).json({ 
        message: error.message || 'Error retrieving user profile' 
      });
    });
});

// Update user profile
router.patch('/profile', authRequired, csrfProtection, function(req, res) {
  const sessionData = req.session.auth;
  const updateData = req.body;
  
  // Remove fields that shouldn't be updated directly
  delete updateData.user_id;
  delete updateData.email;
  delete updateData.created_at;
  
  // Add updated timestamp
  updateData.updated_at = new Date();
  
  // Get user from auth
  supabase.auth.getUser(sessionData.access_token)
    .then(({ data: userData, error: userError }) => {
      if (userError) {
        throw userError;
      }
      
      // Update profile
      return supabase
        .from('user_profiles')
        .update(updateData)
        .match({ user_id: userData.user.id })
        .select('*')
        .single()
        .then(({ data: updatedProfile, error: updateError }) => {
          if (updateError) {
            throw updateError;
          }
          
          res.json({ 
            message: 'Profile updated successfully',
            profile: updatedProfile
          });
        });
    })
    .catch((error) => {
      console.error('Update profile error:', error);
      res.status(error.status || 400).json({ 
        message: error.message || 'Error updating user profile' 
      });
    });
});

// Change password
router.post('/change-password', authRequired, csrfProtection, function(req, res) {
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
  supabase.auth.getUser(sessionData.access_token)
    .then(({ data: userData, error: userError }) => {
      if (userError) {
        throw userError;
      }
      
      const email = userData.user.email;
      
      // Verify current password
      return supabase.auth.signInWithPassword({
        email,
        password: current_password,
      })
        .then(({ error: signInError }) => {
          if (signInError) {
            return res.status(401).json({ message: 'Current password is incorrect' });
          }
          
          // Update the password
          return supabase.auth.updateUser({
            password: new_password,
          })
            .then(({ error: updateError }) => {
              if (updateError) {
                throw updateError;
              }
              
              res.json({ message: 'Password changed successfully' });
            });
        });
    })
    .catch((error) => {
      console.error('Change password error:', error);
      res.status(error.status || 400).json({ 
        message: error.message || 'Error changing password' 
      });
    });
});

// Get user basic info
router.get('/', authRequired, function(req, res) {
  const sessionData = req.session.auth;
  
  // Verify token with Supabase
  supabase.auth.getUser(sessionData.access_token)
    .then(({ data, error }) => {
      if (error) {
        throw error;
      }
      
      res.json({ 
        message: 'User retrieved',
        user: data.user
      });
    })
    .catch((error) => {
      console.error('Get user error:', error);
      res.status(error.status || 401).json({ 
        message: error.message || 'Invalid or expired token' 
      });
    });
});

module.exports = router;