'use client';

import {useSearchParams, useRouter} from 'next/navigation';
import {Button} from '@/components/ui/button';
import {jsPDF} from 'jspdf';
import {useEffect, useState} from 'react';
import {define} from 'ajv';
import {useToast} from "@/hooks/use-toast"

export default function RecipePage() {
  const searchParams = useSearchParams();
  const content = searchParams.get('content');
  const [recipeData, setRecipeData] = useState<any>(null);
    const {toast} = useToast()
  const router = useRouter();

  useEffect(() => {
    if (content) {
      try {
        let decodedContent;
        try {
          decodedContent = decodeURIComponent(content);
        } catch (decodeError) {
          console.error("Error decoding URI:", decodeError);
          toast({
            variant: "destructive",
            title: "Error Decoding URI",
            description: "Failed to decode the recipe content from the URL."
          })
          return;
        }

        try {
          const parsedRecipe = JSON.parse(decodedContent);
          setRecipeData(parsedRecipe);
        } catch (parseError) {
          console.error("Error parsing recipe JSON:", parseError);
          toast({
            variant: "destructive",
            title: "Error Parsing JSON",
            description: "Failed to parse the decoded recipe content."
          })
          setRecipeData({ error: "Error decoding recipe content." });
        }
      } catch (error) {
        console.error("Unexpected error:", error);
        toast({
          variant: "destructive",
          title: "Unexpected Error",
          description: "An unexpected error occurred while processing the recipe content."
        })
        setRecipeData({ error: "Unexpected error occurred." });
      }
    }
  }, [content]);

  const downloadPdf = () => {
    const pdf = new jsPDF();
    pdf.text(JSON.stringify(recipeData), 10, 10);
    pdf.save('recipe.pdf');
  };

  const handleDiscard = () => {
    localStorage.removeItem('generatedRecipe');
    router.push('/');
  };

  if (!content) {
    return <div>No recipe content found.</div>;
  }

  const renderRecipeSection = (section: string, content: any) => {
    if (section.toLowerCase() === 'materials') {
      return (
        <ul>
          {Array.isArray(content) ? (
            content.map((item, index) => (
              <li key={index}>
                <strong>{item.name}:</strong> {item.quantity} ({item.supplier})
              </li>
            ))
          ) : (
            <li>Invalid Materials format</li>
          )}
        </ul>
      );
    } else if (section.toLowerCase() === 'procedure') {
      return (
        <ol>
          {Array.isArray(content) ? (
            content.map((item, index) => (
              <li key={index}>
                <strong>{item.title}:</strong>
                <ol>
                  {Array.isArray(item.steps) ? (
                    item.steps.map((step, stepIndex) => (
                      <li key={stepIndex}>{step}</li>
                    ))
                  ) : (
                    <li>Invalid Steps format</li>
                  )}
                </ol>
              </li>
            ))
          ) : (
            <li>Invalid Procedure format</li>
          )}
        </ol>
      );
    } else if (section.toLowerCase() === 'troubleshooting') {
      return (
        <ul>
          {Array.isArray(content) ? (
            content.map((item, index) => (
              <li key={index}>
                <strong>{item.issue}:</strong> {item.solution}
              </li>
            ))
          ) : (
            <li>Invalid Troubleshooting format</li>
          )}
        </ul>
      );
    } else if (section.toLowerCase() === 'notes') {
        return (
          <ul>
            {Array.isArray(content) ? (
              content.map((item, index) => (
                <li key={index}>
                  {item.note}
                </li>
              ))
            ) : (
              <li>Invalid Notes format</li>
            )}
          </ul>
        );
      }
     else {
      return (
        <div>
          {typeof content === 'string' ? (
            <p>{content}</p>
          ) : (
            Object.entries(content).map(([key, value]) => (
              <p key={key}>
                <strong>{key}:</strong> {value}
              </p>
            ))
          )}
        </div>
      );
    }
  };

  const renderRecipe = (recipe: any) => {
    if (!recipe) {
      return <p>No recipe content.</p>;
    }

    if (recipe.error) {
      return <p>{recipe.error}</p>;
    }

    return (
      <div>
        {Object.entries(recipe).map(([section, content]) => (
          <div key={section} className="mb-4">
            <h3 className="text-lg font-semibold">{section}</h3>
            <div>{renderRecipeSection(section, content)}</div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Recipe Details</h1>
      <div>{renderRecipe(recipeData)}</div>
      <div className="flex gap-4">
        <Button onClick={downloadPdf}>Download as PDF</Button>
        <Button variant="destructive" onClick={handleDiscard}>
          Discard Recipe
        </Button>
      </div>
    </div>
  );
}
