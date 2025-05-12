require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const { csrfProtection, setCSRFToken } = require('./middleware/csrf');
const app = express();
const port = process.env.PORT || 3001;
const query = require('./db');
const { createClient } = require('@supabase/supabase-js');

// Supabase Client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Session configuration (must come before CSRF middleware)
app.use(session({
  secret: process.env.SESSION_SECRET || 'development-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Set CSRF token for all requests
app.use(setCSRFToken);

// Apply CSRF protection to mutating routes
app.use('/login', csrfProtection);
app.use('/signup', csrfProtection);
app.use('/reset-password', csrfProtection);
app.use('/user/recipes', csrfProtection);

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

// Password validation helper function
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

// Auth routes
app.post('/signup', async (req, res, next) => {
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

// Reset password endpoint
app.post('/reset-password', async (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }
  
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.FRONTEND_URL || 'http://localhost:9002'}/reset-password`,
    });
    
    if (error) throw error;
    
    // Don't confirm if email exists for security reasons
    res.json({ message: 'If an account exists with this email, a password reset link has been sent.' });
  } catch (error) {
    console.error('Reset password error:', error);
    // Still return 200 to not reveal if email exists
    res.json({ message: 'If an account exists with this email, a password reset link has been sent.' });
  }
});

// New password endpoint after reset
app.post('/new-password', async (req, res) => {
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
    const { error } = await supabase.auth.updateUser({ 
      password 
    });
    
    if (error) throw error;
    
    res.json({ message: 'Password updated successfully. You can now log in with your new password.' });
  } catch (error) {
    console.error('New password error:', error);
    res.status(error.status || 400).json({ 
      message: error.message || 'Error updating password' 
    });
  }
});

// User profile endpoints
app.get('/user/profile', async (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    // Get user from auth
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError) throw userError;
    
    // Get profile from database
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userData.user.id)
      .single();
    
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
      
      const { data: newProfileData, error: newProfileError } = await supabase
        .from('user_profiles')
        .insert([newProfile])
        .select('*')
        .single();
      
      if (newProfileError) throw newProfileError;
      
      return res.json({ profile: newProfileData });
    }
    
    res.json({ profile: profileData });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(error.status || 401).json({ 
      message: error.message || 'Error retrieving user profile' 
    });
  }
});

// Update user profile
app.patch('/user/profile', async (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }
  
  const token = authHeader.split(' ')[1];
  const updateData = req.body;
  
  // Remove fields that shouldn't be updated directly
  delete updateData.user_id;
  delete updateData.email;
  delete updateData.created_at;
  
  // Add updated timestamp
  updateData.updated_at = new Date();
  
  try {
    // Get user from auth
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError) throw userError;
    
    // Update profile
    const { data: updatedProfile, error: updateError } = await supabase
      .from('user_profiles')
      .update(updateData)
      .match({ user_id: userData.user.id })
      .select('*')
      .single();
    
    if (updateError) throw updateError;
    
    res.json({ 
      message: 'Profile updated successfully',
      profile: updatedProfile
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(error.status || 400).json({ 
      message: error.message || 'Error updating user profile' 
    });
  }
});

// Change password
app.post('/user/change-password', async (req, res) => {
  const { current_password, new_password } = req.body;
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }
  
  if (!current_password || !new_password) {
    return res.status(400).json({ message: 'Current password and new password are required' });
  }
  
  // Validate new password
  const passwordValidation = validatePassword(new_password);
  if (!passwordValidation.valid) {
    return res.status(400).json({ message: passwordValidation.message });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    // First, verify the current password by attempting to sign in
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError) throw userError;
    
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
    
    if (updateError) throw updateError;
    
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(error.status || 400).json({ 
      message: error.message || 'Error changing password' 
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
    return res.status(401).json({ message: 'This endpoint requires a Bearer token' });
  }
  
  try {
    // Extract the token from the Authorization header
    const token = authHeader.split(' ')[1];
    
    // Simply sign out without trying to pass the token to Supabase
    // The signOut method doesn't need a token parameter
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('Supabase signout error:', error);
      throw error;
    }
    
    // Return success message
    res.json({ message: 'Signed out successfully' });
  } catch (error) {
    console.error('Signout error:', error);
    res.status(error.status || 500).json({ 
      message: error.message || 'Error signing out' 
    });
  }
});

// Endpoint to save a recipe
app.post('/user/recipes', async (req, res) => {
  const authHeader = req.headers.authorization;
  const { recipe } = req.body;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }
  
  if (!recipe) {
    return res.status(400).json({ message: 'No recipe data provided' });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    // Get user from auth
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError) throw userError;
    
    // Parse recipe if it's a string
    let recipeData;
    if (typeof recipe === 'string') {
      try {
        recipeData = JSON.parse(recipe);
      } catch (e) {
        return res.status(400).json({ message: 'Invalid recipe format' });
      }
    } else {
      recipeData = recipe;
    }
    
    // Save recipe to database
    const { data: savedRecipe, error: saveError } = await supabase
      .from('saved_recipes')
      .insert([{
        user_id: userData.user.id,
        recipe_name: recipeData.recipeName || 'Unnamed Recipe',
        recipe_data: recipeData,
        category: 'general',
        is_public: false
      }])
      .select('*')
      .single();
    
    if (saveError) throw saveError;
    
    res.status(201).json({
      message: 'Recipe saved successfully',
      recipe: savedRecipe
    });
    
  } catch (error) {
    console.error('Save recipe error:', error);
    res.status(error.status || 500).json({
      message: error.message || 'Failed to save recipe'
    });
  }
});

// Endpoint to get user's saved recipes
app.get('/user/recipes', async (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    // Get user from auth
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError) throw userError;
    
    // Get recipes from database
    const { data: recipes, error: recipesError } = await supabase
      .from('saved_recipes')
      .select('*')
      .eq('user_id', userData.user.id)
      .order('created_at', { ascending: false });
    
    if (recipesError) throw recipesError;
    
    // Transform data to return only recipe_data
    const transformedRecipes = recipes.map(item => item.recipe_data);
    
    res.json({
      recipes: transformedRecipes
    });
    
  } catch (error) {
    console.error('Get recipes error:', error);
    res.status(error.status || 500).json({
      message: error.message || 'Failed to retrieve recipes'
    });
  }
});

// Endpoint to delete a recipe
app.delete('/user/recipes/:recipeId', async (req, res) => {
  const authHeader = req.headers.authorization;
  const { recipeId } = req.params;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }
  
  if (!recipeId) {
    return res.status(400).json({ message: 'Recipe ID is required' });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    // Get user from auth
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError) throw userError;
    
    // Delete recipe from database
    const { error: deleteError } = await supabase
      .from('saved_recipes')
      .delete()
      .eq('id', recipeId)
      .eq('user_id', userData.user.id); // Ensure user can only delete their own recipes
    
    if (deleteError) throw deleteError;
    
    res.json({
      message: 'Recipe deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete recipe error:', error);
    res.status(error.status || 500).json({
      message: error.message || 'Failed to delete recipe'
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