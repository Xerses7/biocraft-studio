'use client';

import {useState} from 'react';
import {generateBiotechRecipe} from '@/ai/flows/generate-biotech-recipe';
import {Button} from '@/components/ui/button';
import {Textarea} from '@/components/ui/textarea';
import {useRouter} from 'next/navigation';
import {toast} from "@/hooks/use-toast"
import {useRecipe} from '@/context/RecipeContext';

export function RecipeGenerator() {
  const [ingredients, setIngredients] = useState('');
  const [desiredOutcome, setDesiredOutcome] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { setCurrentRecipe } = useRecipe();

  const handleGenerateRecipe = async () => {
    setIsLoading(true);
    try {
      const recipe = await generateBiotechRecipe({
        ingredients: ingredients,
        desiredOutcome: desiredOutcome,
      });

      if (recipe && recipe.recipe) {
        if (typeof recipe.recipe === 'object' && recipe.recipe !== null) {
          // It's likely a JavaScript object (or an array, as arrays are objects too)
          // This block executes if JSON.parse likely succeeded in producing an object/array
          console.log("recipeData is an object:", recipe.recipe);
          // You can proceed with rendering logic that expects an object, like Object.entries()
        
        } else if (typeof recipe.recipe === 'string') {
          // It's still a string, meaning JSON.parse likely failed,
          // or the original content wasn't JSON.
          console.log("recipeData is still a string:", recipe.recipe);
          // Display an error or the raw string
        
        } else if (recipe.recipe === null) {
          // It's null, likely the initial state or explicitly set after an error
          console.log("recipeData is null.");
          // Display loading or error message
        
        } else {
          // Handle other types if necessary (number, boolean, undefined)
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
