'use client';

import {useState} from 'react';
import {generateBiotechRecipe} from '@/ai/flows/generate-biotech-recipe';
import {Button} from '@/components/ui/button';
import {Textarea} from '@/components/ui/textarea';
import {useRouter} from 'next/navigation';
import {toast} from "@/hooks/use-toast"
import {useRecipe} from '@/context/RecipeContext';
import { Loader2 } from 'lucide-react';

export function RecipeGenerator() {
  const [ingredients, setIngredients] = useState('');
  const [desiredOutcome, setDesiredOutcome] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { setCurrentRecipe } = useRecipe();

  const handleGenerateRecipe = async () => {
    if (!ingredients.trim() || !desiredOutcome.trim()) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please provide both ingredients and desired outcome.",
      });
      return;
    }
    
    setIsLoading(true);
    try {
      const recipe = await generateBiotechRecipe({
        ingredients: ingredients,
        desiredOutcome: desiredOutcome,
      });

      if (recipe && recipe.recipe) {
        if (typeof recipe.recipe === 'object' && recipe.recipe !== null) {
          console.log("recipeData is an object:", recipe.recipe);
        } else if (typeof recipe.recipe === 'string') {
          console.log("recipeData is still a string:", recipe.recipe);
        } else if (recipe.recipe === null) {
          console.log("recipeData is null.");
        } else {
          console.log("recipeData is of type:", typeof recipe.recipe);
        }

        setCurrentRecipe(recipe.recipe);
        router.push(`/recipe`);
      }

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
      console.error("Error in generateBiotechRecipe:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 max-w-3xl mx-auto">
      <div>
        <label htmlFor="ingredients" className="block text-sm font-medium text-gray-700 mb-1">
          Ingredients:
        </label>
        <div>
          <Textarea
            id="ingredients"
            rows={4}
            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
            placeholder="List your ingredients here..."
            value={ingredients}
            onChange={e => setIngredients(e.target.value)}
          />
        </div>
      </div>
      <div>
        <label htmlFor="desiredOutcome" className="block text-sm font-medium text-gray-700 mb-1">
          Desired Outcome:
        </label>
        <div>
          <Textarea
            id="desiredOutcome"
            rows={4}
            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
            placeholder="Describe the desired outcome of your recipe..."
            value={desiredOutcome}
            onChange={e => setDesiredOutcome(e.target.value)}
          />
        </div>
      </div>
      <Button 
        onClick={handleGenerateRecipe} 
        disabled={isLoading}
        className="w-full md:w-auto md:self-end"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating...
          </>
        ) : (
          'Generate Recipe'
        )}
      </Button>
    </div>
  );
}