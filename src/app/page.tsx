'use client';

import {useState, useEffect} from 'react';
import {RecipeGenerator} from '@/components/RecipeGenerator';
import {RecipeImprovement} from '@/components/RecipeImprovement';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {Button} from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {useRouter} from 'next/navigation';
import {toast} from "@/hooks/use-toast"
import {decodeHTMLEntities} from "@/lib/utils";

export default function Home() {
  const [savedRecipes, setSavedRecipes] = useState<any[]>([]);

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

  const handleRowClick = (recipe: any) => {
    // Navigate to a new page with the recipe content as a query parameter
    router.push(`/recipe?content=${encodeURIComponent(JSON.stringify(recipe))}`);
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
          <RecipeGenerator />
        </TabsContent>
        <TabsContent value="improve">
          <RecipeImprovement />
        </TabsContent>
        <TabsContent value="past">
          <div>
            <h2 className="text-xl font-semibold mb-2">Past Recipes</h2>
            {savedRecipes.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">Recipe Name</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {savedRecipes.map((recipe, index) => {
                      let recipeName = 'JSON Recipe';
                      try {
                        const parsedRecipe = typeof recipe === 'string' ? JSON.parse(decodeHTMLEntities(recipe)) : recipe;
                        recipeName = parsedRecipe.recipeName || 'JSON Recipe';
                      } catch (error) {
                        console.error("Error parsing recipe JSON:", error);
                      }
                      return (
                        <TableRow key={index} onClick={() => handleRowClick(recipe)} className="cursor-pointer hover:bg-secondary">
                          <TableCell>
                            {recipeName}
                          </TableCell>
                        </TableRow>
                      );
                    })}
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

