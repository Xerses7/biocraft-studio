'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { jsPDF } from 'jspdf';
import { useEffect, useState } from 'react';
import { useToast } from "@/hooks/use-toast"
import { useRecipe } from '@/context/RecipeContext';

export default function RecipePage() {
  const router = useRouter();
  // Get context functions and state
  const { currentRecipe, setCurrentRecipe, savedRecipes, setSavedRecipes } = useRecipe();
  const [recipeData, setRecipeData] = useState<any>(null);
  const { data: session } = useSession()
  const { toast } = useToast()
  const [isRecipeSaved, setIsRecipeSaved] = useState(false);

  useEffect(() => {
    let parsedRecipe: any = null;
    if (currentRecipe) {
      try {
        parsedRecipe = JSON.parse(currentRecipe);
        setRecipeData(parsedRecipe);
      } catch (parseError) {
        toast({
          variant: "destructive",
          title: "Error Parsing Recipe",
          description: "Failed to parse the recipe content.",
        });
        setRecipeData(null);
        // Optionally navigate back or show an error state
        // router.push('/');
      }
    } else {
      setRecipeData(null);
    }

    // Check if the *parsed* recipe exists in the context's savedRecipes array
    if (parsedRecipe && Array.isArray(savedRecipes)) {
        const recipeString = JSON.stringify(parsedRecipe); // Ensure consistent comparison
        setIsRecipeSaved(savedRecipes.some(recipe => JSON.stringify(recipe) === recipeString));
    } else {
        setIsRecipeSaved(false);
    }

  }, [currentRecipe, savedRecipes, toast]); // Add savedRecipes to dependency array

  const downloadPdf = () => {
    if (!recipeData) return; // Add check
    const pdf = new jsPDF();
    // Improve PDF content generation (example)
    pdf.setFontSize(16);
    pdf.text(recipeData.recipeName || "Recipe Details", 10, 10);
    pdf.setFontSize(12);
    // Add more structured content from recipeData here...
    pdf.text(JSON.stringify(recipeData, null, 2), 10, 20); // Basic fallback
    pdf.save(`${recipeData.recipeName || 'recipe'}.pdf`);
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

    // Check against context state using stringify for reliable comparison
    const recipeString = JSON.stringify(recipeData);
    if (!savedRecipes.some((recipe: any) => JSON.stringify(recipe) === recipeString)) {
      // Update the CONTEXT state - this is the correct way
      setSavedRecipes([...savedRecipes, recipeData]);
      
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
    setCurrentRecipe(null); // Clear current recipe from context
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
      {recipeData ? (
        <div className="recipe-details-container mb-6 border p-4 rounded"> 
          <h1 className="text-3xl font-bold mb-6">
            {recipeData.recipeName || "Recipe Details"}
          </h1>
          <div className="recipe-materials mb-4"> 
            <h3 className="text-xl font-semibold mb-2">Materials</h3> 
            {recipeData.Materials && recipeData.Materials.length > 0 ? (
              <ul className="list-disc pl-5"> 
                {recipeData.Materials.map((material: any, index: any) => (
                  <li key={index}>
                    {material.name} - {material.quantity}
                    {material.supplier && <span> (Supplier: {material.supplier})</span>}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="recipe-placeholder text-gray-500">No materials listed.</p> )}
          </div>
          <div className="recipe-procedure mb-4">
            <h3 className="text-xl font-semibold mb-2">Procedure</h3> 
              {recipeData.Procedure && recipeData.Procedure.length > 0 ? (
                recipeData.Procedure.map((proc: any, procIndex: any) => (
                  <div key={procIndex} className="mb-4"> 
                    <h4 className="font-semibold">{procIndex + 1}. {proc.title}</h4> 
                    <ul className="list-decimal pl-6 mt-1">
                      {proc.steps.map((step: any, stepIndex: any) => (
                        <li key={stepIndex}>{step}</li>
                      ))}
                    </ul>
                  </div>
                ))
              ) : (
                <p className="recipe-placeholder text-gray-500">No procedure steps available.</p>
              )}
          </div>
          <div className="recipe-troubleshooting mb-4"> 
           <h3 className="text-xl font-semibold mb-2">Troubleshooting</h3> 
            {recipeData.Troubleshooting && recipeData.Troubleshooting.length > 0 ? (
              recipeData.Troubleshooting.map((item: any, index: any) => (
                <div key={index} className="mb-2">
                  <p><strong>Issue:</strong> {item.issue}</p>
                  <p><strong>Solution:</strong> {item.solution}</p>
                </div>
              ))
            ) : (
              <p className="recipe-placeholder text-gray-500">No troubleshooting notes available.</p>
            )}
          </div>
           <div className="recipe-notes mb-4"> 
           <h3 className="text-xl font-semibold mb-2">Notes</h3>
            {recipeData.Notes && recipeData.Notes.length > 0 ? (
              <ul className="list-disc pl-5">
                {recipeData.Notes.map((item:any, index:any) => (
                  <li key={index}>{item.note}</li>
                ))}
              </ul>
            ) : (
              <p className="recipe-placeholder text-gray-500">No additional notes available.</p> 
            )}
          </div>
        </div>
      ) : (
          <p className="text-center text-gray-600">No recipe selected or loaded.</p> // Message when no recipe
      )}

      {recipeData && ( // Only show buttons if there is recipe data and user is logged in
        session && (
          <div className="flex gap-4 mt-4">
            <Button onClick={downloadPdf} disabled={!recipeData}>Download as PDF</Button>
            <Button onClick={handleSaveRecipe} disabled={isRecipeSaved || !recipeData}>
              {isRecipeSaved ? "Recipe Saved" : "Save Recipe"}
            </Button>
            <Button variant="outline" onClick={handleDiscardRecipe}>
              Discard Recipe
            </Button>
          </div>
        )
      )}
      
    </div>
  );
}
