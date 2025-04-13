'use client';

import {useState} from 'react';
import {RecipeGenerator} from '@/components/RecipeGenerator';
import {RecipeImprovement} from '@/components/RecipeImprovement';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {Button} from '@/components/ui/button';

export default function Home() {
  const [generatedRecipe, setGeneratedRecipe] = useState<string | null>(null);
  const [savedRecipes, setSavedRecipes] = useState<string[]>([]);

  const saveRecipe = () => {
    if (generatedRecipe) {
      setSavedRecipes([...savedRecipes, generatedRecipe]);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">BioCraft Studio</h1>

      <Tabs defaultValue="generate">
        <TabsList className="mb-4">
          <TabsTrigger value="generate">Recipe Generation</TabsTrigger>
          <TabsTrigger value="improve">Recipe Improvement</TabsTrigger>
          <TabsTrigger value="past">Past Recipes</TabsTrigger>
        </TabsList>
        <TabsContent value="generate">
          <RecipeGenerator setGeneratedRecipe={setGeneratedRecipe} />
          {generatedRecipe && (
            <div className="mt-4">
              <h2 className="text-xl font-semibold mb-2">Generated Recipe:</h2>
              <p className="whitespace-pre-line">{generatedRecipe}</p>
              <Button onClick={saveRecipe}>Save Recipe</Button>
            </div>
          )}
        </TabsContent>
        <TabsContent value="improve">
          <RecipeImprovement setGeneratedRecipe={setGeneratedRecipe} />
          {generatedRecipe && (
            <div className="mt-4">
              <h2 className="text-xl font-semibold mb-2">Improved Recipe:</h2>
              <p className="whitespace-pre-line">{generatedRecipe}</p>
              <Button onClick={saveRecipe}>Save Recipe</Button>
            </div>
          )}
        </TabsContent>
        <TabsContent value="past">
          <div>
            <h2 className="text-xl font-semibold mb-2">Past Recipes</h2>
            {savedRecipes.length > 0 ? (
              <ul className="list-disc pl-5">
                {savedRecipes.map((recipe, index) => (
                  <li key={index} className="mb-2">
                    <p className="whitespace-pre-line">{recipe}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No recipes saved yet.</p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
