// src/server/routes/recipe.js - Recipe related routes
const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const { csrfProtection } = require('../middleware/csrf');
const { authRequired } = require('../middleware/security');

// Supabase client initialization
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Get all recipes for the user
router.get('/', authRequired, function(req, res) {
  try {
    const sessionData = req.session.auth;
    
    // Get user from auth
    const { data: userData, error: userError } = supabase.auth.getUser(
      sessionData.access_token
    );
    
    if (userError) throw userError;
    
    // Get recipes from database
    const { data: recipes, error: recipesError } = supabase
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

// Save a new recipe
router.post('/', authRequired, csrfProtection, function (req, res) {
  const { recipe } = req.body;
  const sessionData = req.session.auth;
  
  if (!recipe) {
    return res.status(400).json({ message: 'No recipe data provided' });
  }
  
  try {
    // Get user from auth
    const { data: userData, error: userError } = supabase.auth.getUser(
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
    const { data: savedRecipe, error: saveError } = supabase
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

// Get a specific recipe
router.get('/:recipeId', authRequired, function (req, res) {
  const { recipeId } = req.params;
  const sessionData = req.session.auth;
  
  try {
    // Get user from auth
    const { data: userData, error: userError } = supabase.auth.getUser(
      sessionData.access_token
    );
    
    if (userError) throw userError;
    
    // Get specific recipe from database
    const { data: recipe, error: recipeError } = supabase
      .from('saved_recipes')
      .select('*')
      .eq('id', recipeId)
      .eq('user_id', userData.user.id) // Ensure user can only view their own recipes
      .single();
    
    if (recipeError) throw recipeError;
    
    if (!recipe) {
      return res.status(404).json({ message: 'Recipe not found' });
    }
    
    res.json({
      recipe: recipe.recipe_data
    });
    
  } catch (error) {
    console.error('Get recipe error:', error);
    res.status(error.status || 500).json({
      message: error.message || 'Failed to retrieve recipe'
    });
  }
});

// Update a recipe
router.put('/:recipeId', authRequired, csrfProtection, function (req, res) {
  const { recipeId } = req.params;
  const { recipe } = req.body;
  const sessionData = req.session.auth;
  
  if (!recipe) {
    return res.status(400).json({ message: 'No recipe data provided' });
  }
  
  try {
    // Get user from auth
    const { data: userData, error: userError } = supabase.auth.getUser(
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
    
    // Update recipe in database
    const { data: updatedRecipe, error: updateError } = supabase
      .from('saved_recipes')
      .update({
        recipe_name: recipeData.recipeName || 'Unnamed Recipe',
        recipe_data: recipeData,
        updated_at: new Date()
      })
      .match({ 
        id: recipeId,
        user_id: userData.user.id // Ensure user can only update their own recipes
      })
      .select('*')
      .single();
    
    if (updateError) throw updateError;
    
    if (!updatedRecipe) {
      return res.status(404).json({ message: 'Recipe not found or not owned by user' });
    }
    
    res.json({
      message: 'Recipe updated successfully',
      recipe: updatedRecipe
    });
    
  } catch (error) {
    console.error('Update recipe error:', error);
    res.status(error.status || 500).json({
      message: error.message || 'Failed to update recipe'
    });
  }
});

// Delete a recipe
router.delete('/:recipeId', authRequired, csrfProtection, function (req, res) {
  const { recipeId } = req.params;
  const sessionData = req.session.auth;
  
  if (!recipeId) {
    return res.status(400).json({ message: 'Recipe ID is required' });
  }
  
  try {
    // Get user from auth
    const { data: userData, error: userError } = supabase.auth.getUser(
      sessionData.access_token
    );
    
    if (userError) throw userError;
    
    // Delete recipe from database
    const { error: deleteError } = supabase
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

module.exports = router;