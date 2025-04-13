'use client';

import {useState} from 'react';
import {improveExistingRecipe} from '@/ai/flows/improve-existing-recipe';
import {Button} from '@/components/ui/button';
import {Textarea} from '@/components/ui/textarea';
import {toast} from "@/hooks/use-toast"

type RecipeImprovementProps = {
  setGeneratedRecipe: (recipe: string) => void;
};

export function RecipeImprovement({setGeneratedRecipe}: RecipeImprovementProps) {
  const [existingRecipe, setExistingRecipe] = useState('');
  const [desiredOutcomes, setDesiredOutcomes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleImproveRecipe = async () => {
    setIsLoading(true);
    try {
      const recipe = await improveExistingRecipe({
        existingRecipe: existingRecipe,
        desiredOutcomes: desiredOutcomes,
      });
      setGeneratedRecipe(recipe.improvedRecipe);
      toast({
        title: "Recipe Improved",
        description: "Your recipe has been successfully improved.",
      })
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error Improving Recipe",
        description: error.message,
      })
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label htmlFor="existingRecipe" className="block text-sm font-medium text-gray-700">
          Existing Recipe:
        </label>
        <div className="mt-1">
          <Textarea
            id="existingRecipe"
            rows={4}
            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 mt-1 block w-full sm:text-sm border-gray-300 rounded-md"
            placeholder="Paste your existing recipe here..."
            value={existingRecipe}
            onChange={e => setExistingRecipe(e.target.value)}
          />
        </div>
      </div>
      <div>
        <label htmlFor="desiredOutcomes" className="block text-sm font-medium text-gray-700">
          Desired Outcomes:
        </label>
        <div className="mt-1">
          <Textarea
            id="desiredOutcomes"
            rows={4}
            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 mt-1 block w-full sm:text-sm border-gray-300 rounded-md"
            placeholder="Describe the desired outcomes for the improved recipe..."
            value={desiredOutcomes}
            onChange={e => setDesiredOutcomes(e.target.value)}
          />
        </div>
      </div>
      <Button onClick={handleImproveRecipe} disabled={isLoading}>
        {isLoading ? 'Improving...' : 'Improve Recipe'}
      </Button>
    </div>
  );
}
