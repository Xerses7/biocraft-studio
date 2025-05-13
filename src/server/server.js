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
app.get('/auth/callback', async (req, res) => {
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

// Check/refresh session
app.get('/user', async (req, res) => {
  try {
    // Get session data from cookie
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
    
    if (!sessionData || !sessionData.access_token) {
      clearAuthCookies(res);
      return res.status(401).json({ message: 'Invalid session data' });
    }
    
    // Verify token with Supabase
    const { data, error } = await supabase.auth.getUser(sessionData.access_token);
    
    if (error) {
      clearAuthCookies(res);
      throw error;
    }
    
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

// CSRF token endpoint
app.get('/csrf-token', (req, res) => {
  res.status(200).json({ message: 'CSRF token set' });
});

// Endpoint to save a recipe
app.post('/user/recipes', async (req, res) => {
  const { recipe } = req.body;
  
  // Get session data from cookie
  const sessionCookie = req.cookies.auth_session;
  
  if (!sessionCookie) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  let sessionData;
  try {
    sessionData = JSON.parse(sessionCookie);
  } catch (e) {
    return res.status(401).json({ message: 'Invalid session format' });
  }
  
  if (!sessionData || !sessionData.access_token) {
    return res.status(401).json({ message: 'Invalid session data' });
  }
  
  if (!recipe) {
    return res.status(400).json({ message: 'No recipe data provided' });
  }
  
  try {
    // Get user from auth
    const { data: userData, error: userError } = await supabase.auth.getUser(
      sessionData.access_token
    );
    
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
  // Get session data from cookie
  const sessionCookie = req.cookies.auth_session;
  
  if (!sessionCookie) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  let sessionData;
  try {
    sessionData = JSON.parse(sessionCookie);
  } catch (e) {
    return res.status(401).json({ message: 'Invalid session format' });
  }
  
  if (!sessionData || !sessionData.access_token) {
    return res.status(401).json({ message: 'Invalid session data' });
  }
  
  try {
    // Get user from auth
    const { data: userData, error: userError } = await supabase.auth.getUser(
      sessionData.access_token
    );
    
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
  const { recipeId } = req.params;
  
  // Get session data from cookie
  const sessionCookie = req.cookies.auth_session;
  
  if (!sessionCookie) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  let sessionData;
  try {
    sessionData = JSON.parse(sessionCookie);
  } catch (e) {
    return res.status(401).json({ message: 'Invalid session format' });
  }
  
  if (!sessionData || !sessionData.access_token) {
    return res.status(401).json({ message: 'Invalid session data' });
  }
  
  if (!recipeId) {
    return res.status(400).json({ message: 'Recipe ID is required' });
  }
  
  try {
    // Get user from auth
    const { data: userData, error: userError } = await supabase.auth.getUser(
      sessionData.access_token
    );
    
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

// Add security headers middleware for all responses
app.use((req, res, next) => {
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
});

app.listen(port, () => {
  console.log(`BioCraft Studio Backend listening at http://localhost:${port}`);
});