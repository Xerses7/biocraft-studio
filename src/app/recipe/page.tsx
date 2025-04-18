'use client';

import {useRouter} from 'next/navigation';
import {Button} from '@/components/ui/button';
import {jsPDF} from 'jspdf';
import {useEffect, useState} from 'react';
import {useToast} from "@/hooks/use-toast"
import {useRecipe} from '@/context/RecipeContext';

export default function RecipePage() {
  const router = useRouter();
  const { currentRecipe, setCurrentRecipe } = useRecipe();
  const [recipeData, setRecipeData] = useState<any>(null);
  const {toast} = useToast()
  const [isRecipeSaved, setIsRecipeSaved] = useState(false);

  useEffect(() => {
    if (currentRecipe) {
      try {
        const parsedRecipe = JSON.parse(currentRecipe);
        setRecipeData(parsedRecipe);
        setIsRecipeSaved(localStorage.getItem('savedRecipes')?.includes(currentRecipe) || false);
      } catch (parseError) {
        toast({
          variant: "destructive",
          title: "Error Parsing JSON",
          description: "Failed to parse the recipe content.",
        });
        setRecipeData(null);
      }
    } else {
      setRecipeData(null);
    }
  }, [currentRecipe]);

  const downloadPdf = () => {
    const pdf = new jsPDF();
    pdf.text(JSON.stringify(recipeData), 10, 10);
    pdf.save('recipe.pdf');
  };

  const handleSaveRecipe = () => {
    if (!recipeData) {
      toast({
        variant: "destructive",
        title: "No Recipe to Save",
        description: "Please generate or improve a recipe before saving.",
      });
      return;
    }

    const contentString = JSON.stringify(recipeData);

    const storedRecipes = localStorage.getItem('savedRecipes');
    let savedRecipes = storedRecipes ? JSON.parse(storedRecipes) : [];

    if (!savedRecipes.some((recipe: any) => JSON.stringify(recipe) === contentString)) {
      savedRecipes.push(recipeData);
      localStorage.setItem('savedRecipes', JSON.stringify(savedRecipes));
      setIsRecipeSaved(true);
      toast({
        title: "Recipe Saved!",
        description: "This recipe has been saved to your past recipes.",
      });
    } else {
      toast({
        title: "Recipe Already Saved",
        description: "This recipe is already in your saved recipes.",
      });
    }
  };

    const handleDiscardRecipe = () => {
    setCurrentRecipe(null);
    router.push('/');
  };

  const renderRecipeSection = (content: any): React.ReactNode => {
    if (Array.isArray(content)) {
      return (
        <div>
          {content.map((item, index) => (
            <div key={index} className="mb-2">
              {renderRecipeSection(item)}
            </div>
          ))}
        </div>
      );
    } else if (typeof content === 'object' && content !== null) {
      return (
        <div>
          {Object.entries(content).map(([key, value]) => (
            <div key={key} className="mb-4">
              <h4 className="font-semibold">{key}:</h4>
              <div>{renderRecipeSection(value)}</div>
            </div>
          ))}
        </div>
      );
    } else if (typeof content === 'string') {
      return <p>{content}</p>
    } else if (typeof content === 'number') {
      return <p>{content.toString()}</p>;
    } else {
      return null;
    }
  };

  return (
    <div className="container mx-auto py-8">
      {recipeData && (
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold mb-6">
            {recipeData.recipeName || "Recipe Details"}
          </h1>
          {Object.entries(recipeData).map(([key, value]) => (
            <div key={key}>{renderRecipeSection(value)}</div>
          ))}
        </div>
      )}
      <h1 className="text-2xl font-bold mb-4">Recipe Details</h1>
      <div>{recipeData && renderRecipeSection(recipeData)}</div>
      <div className="flex gap-4">
        <Button onClick={downloadPdf}>Download as PDF</Button>
        <Button onClick={handleSaveRecipe} disabled={isRecipeSaved}>
          {isRecipeSaved ? "Recipe Saved!" : "Save Recipe"}
        </Button>
          <Button onClick={handleDiscardRecipe}>
          Discard Recipe
        </Button>
      </div>
    </div>
  );
}
