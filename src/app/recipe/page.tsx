'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { jsPDF } from 'jspdf';
import { useEffect, useState } from 'react';
import { useToast } from "@/hooks/use-toast"
import { useRecipe } from '@/context/RecipeContext';
import { useAuth } from '@/context/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { 
  ArrowLeft, 
  Download, 
  Save, 
  Trash, 
  Loader2, 
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';

export default function RecipePage() {
  const router = useRouter();
  // Get context functions and state
  const { currentRecipe, setCurrentRecipe, savedRecipes, setSavedRecipes } = useRecipe();
  const [recipeData, setRecipeData] = useState<any>(null);
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [isRecipeSaved, setIsRecipeSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false); 
  const isMobile = useIsMobile();

  useEffect(() => {
    let parsedRecipe: any = null;
    if (currentRecipe) {
      try {
        parsedRecipe = JSON.parse(currentRecipe);
        setRecipeData(parsedRecipe);
      } catch (parseError) {
        console.error("Parse error:", parseError);
        toast({
          variant: "destructive",
          title: "Error Parsing Recipe",
          description: "Failed to parse the recipe content.",
        });
        setRecipeData(null);
      }
    } else {
      setRecipeData(null);
    }

    // Check if the parsed recipe exists in the context's savedRecipes array
    if (parsedRecipe && Array.isArray(savedRecipes)) {
        const recipeString = JSON.stringify(parsedRecipe);
        setIsRecipeSaved(savedRecipes.some(recipe => JSON.stringify(recipe) === recipeString));
    } else {
        setIsRecipeSaved(false);
    }

  }, [currentRecipe, savedRecipes, toast]);

  const downloadPdf = async () => {
    if (!recipeData) return;
    
    setIsLoading(true);
    try {
      const pdf = new jsPDF();
      
      // Add title and metadata
      pdf.setFontSize(20);
      pdf.setTextColor(0, 128, 128); // Teal color
      // Using setFont with standard fonts
      pdf.setFont("helvetica", "bold");
      pdf.text(recipeData.recipeName || "Recipe Details", 20, 20);
      
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      pdf.setFont("helvetica", "normal");
      pdf.text(`Created: ${recipeData.dateCreated || new Date().toISOString().split('T')[0]}`, 20, 30);
      pdf.text(`Author: ${recipeData.author || "BioCraft Studio"}`, 20, 38);
      
      // Add description if available
      if (recipeData.description) {
        pdf.setFontSize(11);
        pdf.setFont("helvetica", "italic");
        pdf.text("Description:", 20, 50);
        pdf.setFont("helvetica", "normal");
        const splitDescription = pdf.splitTextToSize(recipeData.description, 170);
        pdf.text(splitDescription, 20, 58);
      }
      
      // Add materials
      let yPos = recipeData.description ? 75 : 50;
      
      pdf.setFontSize(14);
      pdf.setTextColor(0, 128, 128); // Teal color
      pdf.setFont("helvetica", "bold");
      pdf.text("Materials", 20, yPos);
      yPos += 10;
      
      pdf.setFontSize(11);
      pdf.setTextColor(0, 0, 0);
      pdf.setFont("helvetica", "normal");
      
      if (recipeData.Materials && recipeData.Materials.length > 0) {
        recipeData.Materials.forEach((material: any) => {
          pdf.text(`• ${material.name} - ${material.quantity}${material.supplier ? ` (Supplier: ${material.supplier})` : ''}`, 25, yPos);
          yPos += 8;
          
          // Add a new page if we're near the bottom
          if (yPos > 275) {
            pdf.addPage();
            yPos = 20;
          }
        });
      } else {
        pdf.text("No materials listed.", 25, yPos);
        yPos += 8;
      }
      
      // Add procedure
      yPos += 5;
      pdf.setFontSize(14);
      pdf.setTextColor(0, 128, 128); // Teal color
      pdf.setFont("helvetica", "bold");
      pdf.text("Procedure", 20, yPos);
      yPos += 10;
      
      pdf.setFontSize(11);
      pdf.setTextColor(0, 0, 0);
      pdf.setFont("helvetica", "normal");
      
      if (recipeData.Procedure && recipeData.Procedure.length > 0) {
        recipeData.Procedure.forEach((proc: any, procIndex: number) => {
          pdf.setFontSize(12);
          pdf.setFont("helvetica", "bold");
          pdf.text(`${procIndex + 1}. ${proc.title}`, 25, yPos);
          yPos += 8;
          
          pdf.setFontSize(11);
          pdf.setFont("helvetica", "normal");
          if (proc.steps && proc.steps.length > 0) {
            proc.steps.forEach((step: string, stepIndex: number) => {
              const stepText = `   ${String.fromCharCode(97 + stepIndex)}. ${step}`;
              const splitStep = pdf.splitTextToSize(stepText, 165);
              
              // Check if we need a new page
              if (yPos + (splitStep.length * 7) > 275) {
                pdf.addPage();
                yPos = 20;
              }
              
              pdf.text(splitStep, 25, yPos);
              yPos += (splitStep.length * 7) + 3;
            });
          }
          
          yPos += 5;
          
          // Add a new page if needed
          if (yPos > 260) {
            pdf.addPage();
            yPos = 20;
          }
        });
      } else {
        pdf.text("No procedure steps available.", 25, yPos);
        yPos += 8;
      }
      
      // Add troubleshooting
      if (recipeData.Troubleshooting && recipeData.Troubleshooting.length > 0) {
        // Check if we need a new page
        if (yPos > 240) {
          pdf.addPage();
          yPos = 20;
        }
        
        yPos += 5;
        pdf.setFontSize(14);
        pdf.setTextColor(0, 128, 128); // Teal color
        pdf.setFont("helvetica", "bold");
        pdf.text("Troubleshooting", 20, yPos);
        yPos += 10;
        
        pdf.setFontSize(11);
        pdf.setTextColor(0, 0, 0);
        
        recipeData.Troubleshooting.forEach((item: any) => {
          // Check if we need a new page
          if (yPos > 260) {
            pdf.addPage();
            yPos = 20;
          }
          
          pdf.setFont("helvetica", "bold");
          pdf.text("Issue:", 25, yPos);
          pdf.setFont("helvetica", "normal");
          
          const issueText = pdf.splitTextToSize(item.issue, 155);
          pdf.text(issueText, 45, yPos);
          yPos += (issueText.length * 7) + 2;
          
          pdf.setFont("helvetica", "bold");
          pdf.text("Solution:", 25, yPos);
          pdf.setFont("helvetica", "normal");
          
          const solutionText = pdf.splitTextToSize(item.solution, 155);
          pdf.text(solutionText, 45, yPos);
          yPos += (solutionText.length * 7) + 7;
        });
      }
      
      // Add notes
      if (recipeData.Notes && recipeData.Notes.length > 0) {
        // Check if we need a new page
        if (yPos > 260) {
          pdf.addPage();
          yPos = 20;
        }
        
        yPos += 5;
        pdf.setFontSize(14);
        pdf.setTextColor(0, 128, 128); // Teal color
        pdf.setFont("helvetica", "bold");
        pdf.text("Notes", 20, yPos);
        yPos += 10;
        
        pdf.setFontSize(11);
        pdf.setTextColor(0, 0, 0);
        pdf.setFont("helvetica", "normal");
        
        recipeData.Notes.forEach((item: any) => {
          // Check if we need a new page
          if (yPos > 270) {
            pdf.addPage();
            yPos = 20;
          }
          
          const noteText = pdf.splitTextToSize(`• ${item.note}`, 165);
          pdf.text(noteText, 25, yPos);
          yPos += (noteText.length * 7) + 5;
        });
      }
      
      // Add footer
      // Get total number of pages - method differs based on jsPDF version
      let pageCount;
      try {
        // Try newer version method first
        pageCount = pdf.getNumberOfPages();
      } catch (err) {
        console.error("Unable to get page count:", err);
        pageCount = 0;
      }
      
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "italic");
      
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setTextColor(128, 128, 128);
        pdf.text(`Generated by BioCraft Studio - Page ${i} of ${pageCount}`, pdf.internal.pageSize.width / 2, 287, { align: 'center' });
      }
      
      pdf.save(`${recipeData.recipeName || 'biocraft-recipe'}.pdf`);
      
      toast({
        title: "PDF Downloaded",
        description: "Your recipe has been downloaded as a PDF file.",
      });
      
    } catch (error) {
      console.error("PDF generation error:", error);
      toast({
        variant: "destructive",
        title: "PDF Generation Failed",
        description: "There was an error generating the PDF file.",
      });
    } finally {
      setIsLoading(false);
    }
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
      // Update the CONTEXT state
      setSavedRecipes([...savedRecipes, recipeData]);
      setIsRecipeSaved(true);
      
      toast({
        title: "Recipe Saved!",
        description: "This recipe has been saved to your saved recipes.",
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

  if (!recipeData) {
    return (
      <div className="container mx-auto py-8 px-4 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mb-4 mx-auto" />
          <h2 className="text-xl font-semibold mb-2">No Recipe Found</h2>
          <p className="text-muted-foreground mb-6">No recipe is currently selected or loaded.</p>
          <Button onClick={() => router.push('/')} className="flex items-center">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Return to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-4 px-4 md:py-8 md:px-6">
      <div className="mb-6">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => router.push('/')}
          className="mb-4 hover:bg-secondary"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>
      </div>
      
      <div className="recipe-details-container mb-6 border p-4 rounded"> 
        <h1 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6 break-words">
          {recipeData.recipeName || "Recipe Details"}
        </h1>
        
        {recipeData.description && (
          <div className="mb-6 italic text-muted-foreground">
            {recipeData.description}
          </div>
        )}
        
        <div className="recipe-materials mb-6"> 
          <h3 className="text-lg md:text-xl font-semibold mb-2">Materials</h3> 
          {recipeData.Materials && recipeData.Materials.length > 0 ? (
            <ul className="list-disc pl-5 space-y-2"> 
              {recipeData.Materials.map((material: any, index: number) => (
                <li key={index} className="break-words">
                  <span className="font-medium">{material.name}</span> - {material.quantity}
                  {material.supplier && <span className="block text-sm md:inline md:text-base md:ml-1">(Supplier: {material.supplier})</span>}
                </li>
              ))}
            </ul>
          ) : (
            <p className="recipe-placeholder text-gray-500">No materials listed.</p>
          )}
        </div>
        
        <div className="recipe-procedure mb-6">
          <h3 className="text-lg md:text-xl font-semibold mb-2">Procedure</h3> 
            {recipeData.Procedure && recipeData.Procedure.length > 0 ? (
              recipeData.Procedure.map((proc: any, procIndex: number) => (
                <div key={procIndex} className="mb-5"> 
                  <h4 className="font-semibold">{procIndex + 1}. {proc.title}</h4> 
                  <ul className="list-decimal pl-6 mt-2 space-y-3">
                    {proc.steps.map((step: string, stepIndex: number) => (
                      <li key={stepIndex} className="break-words pl-1">{step}</li>
                    ))}
                  </ul>
                </div>
              ))
            ) : (
              <p className="recipe-placeholder text-gray-500">No procedure steps available.</p>
            )}
        </div>
        
        <div className="recipe-troubleshooting mb-6"> 
          <h3 className="text-lg md:text-xl font-semibold mb-2">Troubleshooting</h3> 
          {recipeData.Troubleshooting && recipeData.Troubleshooting.length > 0 ? (
            <div className="space-y-4">
              {recipeData.Troubleshooting.map((item: any, index: number) => (
                <div key={index} className="p-3 border-l-4 border-primary bg-secondary/10 rounded">
                  <p className="mb-2"><strong className="text-primary">Issue:</strong> {item.issue}</p>
                  <p><strong className="text-primary">Solution:</strong> {item.solution}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="recipe-placeholder text-gray-500">No troubleshooting notes available.</p>
          )}
        </div>
        
        <div className="recipe-notes mb-2"> 
          <h3 className="text-lg md:text-xl font-semibold mb-2">Notes</h3>
          {recipeData.Notes && recipeData.Notes.length > 0 ? (
            <ul className="list-disc pl-5 space-y-3">
              {recipeData.Notes.map((item: any, index: number) => (
                <li key={index} className="p-2 bg-secondary/10 rounded break-words">{item.note}</li>
              ))}
            </ul>
          ) : (
            <p className="recipe-placeholder text-gray-500">No additional notes available.</p> 
          )}
        </div>
        
        <div className="flex justify-between items-center text-xs text-muted-foreground mt-6 pt-4 border-t">
          <div>Created: {recipeData.dateCreated || "Unknown"}</div>
          <div>Version: {recipeData.version || "1.0"}</div>
          <div>Author: {recipeData.author || "BioCraft Studio"}</div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 md:gap-4 mt-4 mb-8">
        {isAuthenticated && (
          <Button 
            onClick={downloadPdf} 
            disabled={!recipeData || isLoading}
            className="w-full sm:w-auto flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating PDF...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Download as PDF
              </>
            )}
          </Button>
        )}
         
        {isAuthenticated ? (
          <Button 
            onClick={handleSaveRecipe} 
            disabled={isRecipeSaved || !recipeData || isLoading}
            className="w-full sm:w-auto flex items-center justify-center"
            variant={isRecipeSaved ? "outline" : "default"}
          >
            <Save className="mr-2 h-4 w-4" />
            {isRecipeSaved ? "Recipe Saved" : "Save Recipe"}
          </Button>
        ) : (
          <Button 
            onClick={() => {
              toast({
                title: "Login Required",
                description: "Please log in to save recipes",
                variant: "default"
              });
              router.push('/?login=true');
            }}
            className="w-full sm:w-auto flex items-center justify-center"
          >
            <Save className="mr-2 h-4 w-4" />
            Login to Save
          </Button>
        )}
         
        <Button 
          variant="outline" 
          onClick={handleDiscardRecipe}
          className="w-full sm:w-auto flex items-center justify-center"
        > 
          <Trash className="mr-2 h-4 w-4" />
          Discard Recipe
        </Button>
      </div>
    </div>
  );
}