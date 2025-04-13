'use client';

import {useState} from 'react';
import {RecipeGenerator} from '@/components/RecipeGenerator';
import {RecipeImprovement} from '@/components/RecipeImprovement';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';

export default function Home() {
  const [generatedRecipe, setGeneratedRecipe] = useState<string | null>(null);

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
            </div>
          )}
        </TabsContent>
        <TabsContent value="improve">
          <RecipeImprovement setGeneratedRecipe={setGeneratedRecipe} />
          {generatedRecipe && (
            <div className="mt-4">
              <h2 className="text-xl font-semibold mb-2">Improved Recipe:</h2>
              <p className="whitespace-pre-line">{generatedRecipe}</p>
            </div>
          )}
        </TabsContent>
        <TabsContent value="past">
          <div>
            <h2 className="text-xl font-semibold mb-2">Past Recipes</h2>
            <p>This tab will display a list of saved recipes in future iterations.</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
