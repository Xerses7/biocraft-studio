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
        <div className="recipe-details-container">
          <h1 className="text-3xl font-bold mb-6">
            {recipeData.recipeName || "Recipe Details"}
          </h1>
          <div className="recipe-materials">
            <h3>Materials</h3> {/* Declares the section */}
            {recipeData.Materials && recipeData.Materials.length > 0 ? (
              recipeData.Materials.map((material:any, index:any) => (
                <div key={index}> {/* Each material gets its own div (row) */}
                  <span>{material.name}</span> - <span>{material.quantity}</span>
                  {material.supplier && <span> (Supplier: {material.supplier})</span>} {/* Optionally display supplier */}
                </div>
              ))
            ) : (
              <p className="recipe-placeholder">No materials listed.</p>
            )}
          </div>
          <div className="recipe-procedure">
            <h3>Procedure</h3> {/* Declares the section */}
              {recipeData.Procedure && recipeData.Procedure.length > 0 ? (
                recipeData.Procedure.map((proc:any, procIndex:any) => (
                  <div key={procIndex} style={{ marginBottom: '1em' }}> {/* Add some space between procedures */}
                    <h4>{procIndex + 1}. {proc.title}</h4> {/* Numbered title */}
                    <ul> 
                      {proc.steps.map((step: any, stepIndex: any) => (
                        <li key={stepIndex}>{step}</li> 
                      ))}
                    </ul>
                  </div>
                ))
              ) : (
                <p className="recipe-placeholder">No procedure steps available.</p>
              )}
          </div>
          <div className="recipe-troubleshooting">
          <h3>Troubleshooting</h3> {/* Declares the section */}
            {recipeData.Troubleshooting && recipeData.Troubleshooting.length > 0 ? (
              recipeData.Troubleshooting.map((item:any, index:any) => (
                <div key={index} style={{ marginBottom: '0.75em' }}> {/* Add space between items */}
                  <p><strong>Issue:</strong> {item.issue}</p> {/* Bold label for issue */}
                  <p><strong>Solution:</strong> {item.solution}</p> {/* Bold label for solution */}
                </div>
              ))
            ) : (
              <p className="recipe-placeholder">No troubleshooting notes available.</p> /* Optional: message if empty */
            )}
          </div>
          <div className="recipe-notes">
          <h3>Notes</h3> {/* Declares the section */}
            {recipeData.Notes && recipeData.Notes.length > 0 ? (
              <ul> {/* Unordered list for notes */}
                {recipeData.Notes.map((item:any, index:any) => (
                  <li key={index}>{item.note}</li>
                ))}
              </ul>
            ) : (
              <p className="recipe-placeholder">No additional notes available.</p> /* Optional: message if empty */
            )}
          </div>
           {/* {Object.entries(recipeData).map(([key, value]) => (
            <div key={key}>{renderRecipeSection(value)}</div>
          )) } */}
        </div>
      )}
      
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
