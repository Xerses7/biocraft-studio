'use client';

import {useState, useEffect} from 'react';
import {RecipeGenerator} from '@/components/RecipeGenerator';
import {RecipeImprovement} from '@/components/RecipeImprovement';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {Button} from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {useRouter} from 'next/navigation';
import {toast} from "@/hooks/use-toast"

export default function Home() {
  const [generatedRecipe, setGeneratedRecipe] = useState<string | null>(null);
  const [savedRecipes, setSavedRecipes] = useState<string[]>([]);
  const [isRecipeSaved, setIsRecipeSaved] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Load recipes from local storage on component mount
    const storedRecipes = localStorage.getItem('savedRecipes');
    if (storedRecipes) {
      setSavedRecipes(JSON.parse(storedRecipes));
    }
  }, []);

  useEffect(() => {
    // Save recipes to local storage whenever savedRecipes changes
    localStorage.setItem('savedRecipes', JSON.stringify(savedRecipes));
  }, [savedRecipes]);

  const saveRecipe = () => {
    if (generatedRecipe) {
      setSavedRecipes([...savedRecipes, generatedRecipe]);
      setIsRecipeSaved(true);
      toast({
        title: "Recipe saved!",
        description: "This recipe has been saved to your past recipes.",
      })
    }
  };

  const discardRecipe = () => {
    setGeneratedRecipe(null);
    setIsRecipeSaved(false);
  };

  const handleRowClick = (recipe: string) => {
    // Navigate to a new page with the recipe content as a query parameter
    router.push(`/recipe?content=${encodeURIComponent(recipe)}`);
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
              <div className="flex gap-2">
                <Button onClick={saveRecipe} disabled={isRecipeSaved}>
                  {isRecipeSaved ? 'Recipe Saved!' : 'Save Recipe'}
                </Button>
                <Button variant="destructive" onClick={discardRecipe}>
                  Discard Recipe
                </Button>
              </div>
            </div>
          )}
        </TabsContent>
        <TabsContent value="improve">
          <RecipeImprovement setGeneratedRecipe={setGeneratedRecipe} />
          {generatedRecipe && (
            <div className="mt-4">
              <h2 className="text-xl font-semibold mb-2">Improved Recipe:</h2>
              <p className="whitespace-pre-line">{generatedRecipe}</p>
              <div className="flex gap-2">
                <Button onClick={saveRecipe} disabled={isRecipeSaved}>
                  {isRecipeSaved ? 'Recipe Saved!' : 'Save Recipe'}
                </Button>
                <Button variant="destructive" onClick={discardRecipe}>
                  Discard Recipe
                </Button>
              </div>
            </div>
          )}
        </TabsContent>
        <TabsContent value="past">
          <div>
            <h2 className="text-xl font-semibold mb-2">Past Recipes</h2>
            {savedRecipes.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">Recipe</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {savedRecipes.map((recipe, index) => (
                      <TableRow key={index} onClick={() => handleRowClick(recipe)} className="cursor-pointer hover:bg-secondary">
                        <TableCell>
                          {recipe.substring(0, 50)}...
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p>No recipes saved yet.</p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
