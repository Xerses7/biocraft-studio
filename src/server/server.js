require('dotenv').config();
const express = require('express');
const app = express();
const port = process.env.PORT || 3001;
const query = require('./db');
const { createClient } = require('@supabase/supabase-js');

// Supabase Client
const supabaseUrl = process.env.SUPABASE_URL; // get from .env
const supabaseKey = process.env.SUPABASE_ANON_KEY; // get from .env
const supabase = createClient(supabaseUrl, supabaseKey);

app.use(express.json()); // To parse JSON request bodies

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Auth routes
app.post('/signup', async (req, res, next) => {
  const { email, password } = req.body;
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) throw error;
    res.status(201).json({ message: 'User created', user: data });
  } catch (error) {
    next(error);
  }
});

app.post('/login', async (req, res, next) => {
  const { email, password } = req.body;
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;

    res.json({ message: 'Logged in', session: data.session });
  } catch (error) {
    next(error);
  }
});
app.get('/user', async (req, res, next) => {
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    res.json({ message: 'user retrieved', user: data });
  } catch (error) {
    next(error);
  }
});

app.get('/', async (req, res) => {
try {
    console.log("Connecting to database...");
    const result = await query('SELECT NOW()');
    res.send('Hello from BioCraft Studio Backend! Database connection successful. Current time is: ' + result.rows[0].now);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error connecting to database');
  }
});

app.listen(port, () => {
  console.log(`BioCraft Studio Backend listening at http://localhost:${port}`);
});


