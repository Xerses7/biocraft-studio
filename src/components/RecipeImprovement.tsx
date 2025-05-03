'use client';

import {useState} from 'react';
import {improveExistingRecipe} from '@/ai/flows/improve-existing-recipe';
import {Button} from '@/components/ui/button';
import {Textarea} from '@/components/ui/textarea';
import {useRouter} from 'next/navigation';
import {toast} from "@/hooks/use-toast"
import {useRecipe} from '@/context/RecipeContext';
import { Loader2 } from 'lucide-react';

export function RecipeImprovement() {
  const [existingRecipe, setExistingRecipe] = useState('');
  const [desiredOutcomes, setDesiredOutcomes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { setCurrentRecipe } = useRecipe();

  const handleImproveRecipe = async () => {
    if (!existingRecipe.trim() || !desiredOutcomes.trim()) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please provide both the existing recipe and desired outcomes.",
      });
      return;
    }
    
    setIsLoading(true);
    try {
      const recipe = await improveExistingRecipe({
        existingRecipe: existingRecipe,
        desiredOutcomes: desiredOutcomes,
      });

      if (recipe && recipe.improvedRecipe) {
        setCurrentRecipe(recipe.improvedRecipe);
        router.push(`/recipe`);
      }

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
    <div className="flex flex-col gap-4 max-w-3xl mx-auto">
      <div>
        <label htmlFor="existingRecipe" className="block text-sm font-medium text-gray-700 mb-1">
          Existing Recipe:
        </label>
        <div>
          <Textarea
            id="existingRecipe"
            rows={4}
            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
            placeholder="Paste your existing recipe here..."
            value={existingRecipe}
            onChange={e => setExistingRecipe(e.target.value)}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Paste your recipe in JSON format or as plain text with clear sections for materials, procedure, etc.
          </p>
        </div>
      </div>
      <div>
        <label htmlFor="desiredOutcomes" className="block text-sm font-medium text-gray-700 mb-1">
          Desired Outcomes:
        </label>
        <div>
          <Textarea
            id="desiredOutcomes"
            rows={4}
            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
            placeholder="Describe the desired outcomes for the improved recipe..."
            value={desiredOutcomes}
            onChange={e => setDesiredOutcomes(e.target.value)}
          />
        </div>
      </div>
      <Button 
        onClick={handleImproveRecipe} 
        disabled={isLoading}
        className="w-full md:w-auto md:self-end"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Improving...
          </>
        ) : (
          'Improve Recipe'
        )}
      </Button>
    </div>
  );
}