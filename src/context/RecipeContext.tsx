'use client';

import React, { createContext, useState, useContext, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';

interface RecipeContextType {
  currentRecipe: string | null;
  setCurrentRecipe: (recipe: string | null) => void;
  savedRecipes: any[];
  setSavedRecipes: (recipes: any[]) => void;
  saveRecipeToDb: (recipe: any) => Promise<boolean>;
  loadRecipesFromDb: () => Promise<void>;
  deleteRecipeFromDb: (recipeId: string) => Promise<boolean>;
  isLoadingRecipes: boolean;
}

const RecipeContext = createContext<RecipeContextType | undefined>(undefined);

// Backend URL
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

export const RecipeProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentRecipe, setCurrentRecipe] = useState<string | null>(null);
  const [savedRecipes, setSavedRecipes] = useState<any[]>([]);
  const [isLoadingRecipes, setIsLoadingRecipes] = useState<boolean>(false);
  const { session, isAuthenticated, csrfToken } = useAuth();
  const { toast } = useToast();

  // Load recipes from DB when user is authenticated
  useEffect(() => {
    if (isAuthenticated && session) {
      loadRecipesFromDb();
    } else {
      // Clear recipes if user logs out
      setSavedRecipes([]);
    }
  }, [isAuthenticated, session]);

  // Function to save recipe to database
  const saveRecipeToDb = async (recipe: any): Promise<boolean> => {
    if (!isAuthenticated) {
      toast({
        variant: "destructive",
        title: "Authentication Required",
        description: "You must be logged in to save recipes",
      });
      return false;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/user/recipes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken || ''
        },
        body: JSON.stringify({
          recipe: typeof recipe === 'string' ? recipe : JSON.stringify(recipe)
        }),
        credentials: 'include', // Include cookies for authentication
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `API responded with status: ${response.status}`);
      }

      const data = await response.json();
      
      // Update local state with the newly saved recipe
      // Use the recipe data, not the full DB response
      const recipeData = typeof recipe === 'string' ? JSON.parse(recipe) : recipe;
      
      // Make sure we don't add duplicates
      const recipeString = JSON.stringify(recipeData);
      if (!savedRecipes.some((r) => JSON.stringify(r) === recipeString)) {
        setSavedRecipes((prev) => [...prev, recipeData]);
      }
      
      return true;
    } catch (error: any) {
      console.error('Error saving recipe:', error);
      toast({
        variant: "destructive",
        title: "Failed to Save Recipe",
        description: error.message || "An unexpected error occurred",
      });
      return false;
    }
  };

  // Function to load recipes from database
  const loadRecipesFromDb = async (): Promise<void> => {
    if (!isAuthenticated) {
      return;
    }

    setIsLoadingRecipes(true);

    try {
      const response = await fetch(`${BACKEND_URL}/user/recipes`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for authentication
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `API responded with status: ${response.status}`);
      }

      const data = await response.json();
      setSavedRecipes(data.recipes || []);
    } catch (error: any) {
      console.error('Error loading recipes:', error);
      toast({
        variant: "destructive",
        title: "Failed to Load Recipes",
        description: error.message || "An unexpected error occurred",
      });
    } finally {
      setIsLoadingRecipes(false);
    }
  };

  // Function to delete recipe from database
  const deleteRecipeFromDb = async (recipeId: string): Promise<boolean> => {
    if (!isAuthenticated) {
      toast({
        variant: "destructive",
        title: "Authentication Required",
        description: "You must be logged in to delete recipes",
      });
      return false;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/user/recipes/${recipeId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken || ''
        },
        credentials: 'include', // Include cookies for authentication
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `API responded with status: ${response.status}`);
      }

      // Update local state by removing the deleted recipe
      setSavedRecipes((prev) => prev.filter((recipe) => recipe.id !== recipeId));
      
      return true;
    } catch (error: any) {
      console.error('Error deleting recipe:', error);
      toast({
        variant: "destructive",
        title: "Failed to Delete Recipe",
        description: error.message || "An unexpected error occurred",
      });
      return false;
    }
  };

  return (
    <RecipeContext.Provider
      value={{ 
        currentRecipe, 
        setCurrentRecipe, 
        savedRecipes, 
        setSavedRecipes,
        saveRecipeToDb,
        loadRecipesFromDb,
        deleteRecipeFromDb,
        isLoadingRecipes
      }}
    >
      {children}
    </RecipeContext.Provider>
  );
};

export const useRecipe = () => {
  const context = useContext(RecipeContext);
  if (context === undefined) {
    throw new Error('useRecipe must be used within a RecipeProvider');
  }
  return context;
};