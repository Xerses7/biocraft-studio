'use client';

import {useSearchParams} from 'next/navigation';
import {Button} from '@/components/ui/button';
import {jsPDF} from 'jspdf';
import {useEffect, useState} from 'react';

export default function RecipePage() {
  const searchParams = useSearchParams();
  const content = searchParams.get('content');
  const [recipeData, setRecipeData] = useState<any>(null);

  useEffect(() => {
    if (content) {
      try {
        const decodedContent = JSON.parse(decodeURIComponent(content));
        setRecipeData(decodedContent);
      } catch (error) {
        console.error("Error parsing recipe JSON:", error);
        setRecipeData({ error: "Error decoding recipe content." });
      }
    }
  }, [content]);

  const downloadPdf = () => {
    const pdf = new jsPDF();
    pdf.text(JSON.stringify(recipeData), 10, 10);
    pdf.save('recipe.pdf');
  };

  if (!content) {
    return <div>No recipe content found.</div>;
  }

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
      return <p>No recipe content.</p>;
    }

    if (recipe.error) {
      return <p>{recipe.error}</p>;
    }

    if (typeof recipe === 'object' && recipe !== null) {
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
    } else {
      return <p>Invalid recipe format.</p>;
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Recipe Details</h1>
      <div>{renderRecipe(recipeData)}</div>
      <Button onClick={downloadPdf}>Download as PDF</Button>
    </div>
  );
}
