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
              <div dangerouslySetInnerHTML={{ __html: content }} />
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
