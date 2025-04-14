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

export default function Home() {
  const [generatedRecipe, setGeneratedRecipe] = useState<any | null>(null);
  const [savedRecipes, setSavedRecipes] = useState<any[]>([]);
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

  const handleTabChange = (value: string) => {
    setGeneratedRecipe(null);
    setIsRecipeSaved(false);
  };

  const handleRowClick = (recipe: any) => {
    // Navigate to a new page with the recipe content as a query parameter
    router.push(`/recipe?content=${encodeURIComponent(JSON.stringify(recipe))}`);
  };

  const renderRecipeSection = (section: string, content: any) => {
    if (typeof content === 'object' && content !== null) {
      if (section.toLowerCase() === 'materials') {
        return (
          <ul>
            {Object.entries(content).map(([item, description]) => (
              <li key={item}>
                <strong>{item}:</strong> {description}
              </li>
            ))}
          </ul>
        );
      } else if (section.toLowerCase() === 'procedure') {
        return (
          <ol>
            {Object.entries(content).map(([step, instruction]) => (
              <li key={step}>
                <strong>{step}:</strong> {instruction}
              </li>
            ))}
          </ol>
        );
      } else if (section.toLowerCase() === 'troubleshooting') {
        return (
          <ul>
            {Object.entries(content).map(([problem, solution]) => (
              <li key={problem}>
                <strong>{problem}:</strong> {solution}
              </li>
            ))}
          </ul>
        );
      } else {
        // Render other sections as key-value pairs
        return (
          <div>
            {Object.entries(content).map(([key, value]) => (
              <p key={key}>
                <strong>{key}:</strong> {value}
              </p>
            ))}
          </div>
        );
      }
    } else {
      // If content is not an object, render it as a paragraph
      return <p>{content}</p>;
    }
  };

  const renderRecipe = (recipe: any) => {
    if (!recipe) {
      return <p>No recipe generated.</p>;
    }

    try {
      const sanitizedRecipe = typeof recipe === 'string'
        ? recipe.replace(/[\x00-\x1F\x7F-\x9F]/g, (c) => `&#${c.charCodeAt(0)};`)
        : recipe;

        let recipeData;
        if (typeof sanitizedRecipe === 'string') {
            try {
                console.log(sanitizedRecipe);
                recipeData = JSON.parse(sanitizedRecipe);
            } catch (e) {
                console.error("Error parsing recipe JSON:", e);
                return <p>Error decoding recipe content: Invalid JSON format.</p>;
            }
        } else {
            recipeData = sanitizedRecipe;
        }

      if (typeof recipeData === 'object' && recipeData !== null) {
        return (
          <div>
            {Object.entries(recipeData).map(([section, content]) => (
              <div key={section} className="mb-4">
                <h3 className="text-lg font-semibold">{section}</h3>
                <div>{renderRecipeSection(section, content)}</div>
              </div>
            ))}
          </div>
        );
      } else {
        return <p>Invalid recipe format.</p>;
      }
    } catch (error) {
      console.error("Error parsing recipe JSON:", error);
      return <p>Error decoding recipe content.</p>;
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">BioCraft Studio</h1>

      <Tabs defaultValue="generate" >
        <TabsList className="mb-4">
          <TabsTrigger value="generate" onClick={discardRecipe}>Recipe Generation</TabsTrigger>
          <TabsTrigger value="improve" onClick={discardRecipe}>Recipe Improvement</TabsTrigger>
          <TabsTrigger value="past">Past Recipes</TabsTrigger>
        </TabsList>
        <TabsContent value="generate">
          <RecipeGenerator setGeneratedRecipe={setGeneratedRecipe} />
          {generatedRecipe && (
            <div className="mt-4">
              <h2 className="text-xl font-semibold mb-2">Generated Recipe:</h2>
              <div>{renderRecipe(generatedRecipe)}</div>
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
              <div>{renderRecipe(generatedRecipe)}</div>
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
                          {typeof recipe === 'string' ? recipe.substring(0, 50) + "..." : 'JSON Recipe'}
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
