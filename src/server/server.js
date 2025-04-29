// Aggiornamento di src/server/server.js

require('dotenv').config();
const express = require('express');
const cors = require('cors'); // È necessario aggiungere cors come dipendenza
const app = express();
const port = process.env.PORT || 3001;
const query = require('./db');
const { createClient } = require('@supabase/supabase-js');

// Supabase Client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Middleware
app.use(express.json());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:9002',
  credentials: true
}));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Something broke!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// Auth routes
app.post('/signup', async (req, res, next) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }
  
  try {
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

app.post('/login', async (req, res, next) => {
  const { email, password } = req.body;
  
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

    res.json({ 
      message: 'Signed in successfully',
      session: data.session
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(error.status || 401).json({ 
      message: error.message || 'Invalid login credentials' 
    });
  }
});

// Social login redirects
app.get('/auth/google', (req, res) => {
  const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:9002'}/auth/callback`;
  const authUrl = supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUrl
    }
  });
  res.redirect(authUrl);
});

app.get('/auth/github', (req, res) => {
  const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:9002'}/auth/callback`;
  const authUrl = supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo: redirectUrl
    }
  });
  res.redirect(authUrl);
});

// Auth callback processing
app.get('/auth/callback', (req, res) => {
  // This is handled by the frontend
  res.redirect('/');
});

// Check/refresh session
app.get('/user', async (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error) throw error;
    
    res.json({ 
      message: 'User retrieved',
      user: data.user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(error.status || 401).json({ 
      message: error.message || 'Invalid or expired token' 
    });
  }
});

app.post('/signout', async (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }
  
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    
    res.json({ message: 'Signed out successfully' });
  } catch (error) {
    console.error('Signout error:', error);
    res.status(error.status || 500).json({ 
      message: error.message || 'Error signing out' 
    });
  }
});

// Health check endpoint
app.get('/', async (req, res) => {
  try {
    console.log("Connecting to database...");
    const result = await query('SELECT NOW()');
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

app.listen(port, () => {
  console.log(`BioCraft Studio Backend listening at http://localhost:${port}`);
});