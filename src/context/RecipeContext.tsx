'use client';

import React, { createContext, useState, useContext } from 'react';

interface RecipeContextType {
  currentRecipe: string | null;
    setCurrentRecipe: (recipe: string | null) => void;
    savedRecipes: any[];
    setSavedRecipes: (recipes: any[]) => void;
}

const RecipeContext = createContext<RecipeContextType | undefined>(undefined);

export const RecipeProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentRecipe, setCurrentRecipe] = useState<string | null>(null);
    const [savedRecipes, setSavedRecipes] = useState<any[]>([]);
    return (
        <RecipeContext.Provider
            value={{ currentRecipe, setCurrentRecipe, savedRecipes, setSavedRecipes }}
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
