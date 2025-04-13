'use client';

import {useState} from 'react';
import {generateBiotechRecipe} from '@/ai/flows/generate-biotech-recipe';
import {Button} from '@/components/ui/button';
import {Textarea} from '@/components/ui/textarea';
import {toast} from "@/hooks/use-toast"

type RecipeGeneratorProps = {
  setGeneratedRecipe: (recipe: string) => void;
};

export function RecipeGenerator({setGeneratedRecipe}: RecipeGeneratorProps) {
  const [ingredients, setIngredients] = useState('');
  const [desiredOutcome, setDesiredOutcome] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerateRecipe = async () => {
    setIsLoading(true);
    try {
      const recipe = await generateBiotechRecipe({
        ingredients: ingredients,
        desiredOutcome: desiredOutcome,
      });

      setGeneratedRecipe(recipe.recipe);
      toast({
        title: "Recipe Generated",
        description: "Your recipe has been successfully generated.",
      })
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error Generating Recipe",
        description: error.message,
      })
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label htmlFor="ingredients" className="block text-sm font-medium text-gray-700">
          Ingredients:
        </label>
        <div className="mt-1">
          <Textarea
            id="ingredients"
            rows={4}
            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 mt-1 block w-full sm:text-sm border-gray-300 rounded-md"
            placeholder="List your ingredients here..."
            value={ingredients}
            onChange={e => setIngredients(e.target.value)}
          />
        </div>
      </div>
      <div>
        <label htmlFor="desiredOutcome" className="block text-sm font-medium text-gray-700">
          Desired Outcome:
        </label>
        <div className="mt-1">
          <Textarea
            id="desiredOutcome"
            rows={4}
            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 mt-1 block w-full sm:text-sm border-gray-300 rounded-md"
            placeholder="Describe the desired outcome of your recipe..."
            value={desiredOutcome}
            onChange={e => setDesiredOutcome(e.target.value)}
          />
        </div>
      </div>
      <Button onClick={handleGenerateRecipe} disabled={isLoading}>
        {isLoading ? 'Generating...' : 'Generate Recipe'}
      </Button>
    </div>
  );
}
