'use client';

import {useSearchParams} from 'next/navigation';
import {Button} from '@/components/ui/button';
import {jsPDF} from 'jspdf';
import {useEffect, useState} from 'react';

export default function RecipePage() {
  const searchParams = useSearchParams();
  const content = searchParams.get('content');
  const [decodedContent, setDecodedContent] = useState<string>('');

  useEffect(() => {
    if (content) {
      setDecodedContent(content);
    }
  }, [content]);

  const downloadPdf = () => {
    const pdf = new jsPDF();
    pdf.text(decodedContent, 10, 10);
    pdf.save('recipe.pdf');
  };

  if (!content) {
    return <div>No recipe content found.</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Recipe Details</h1>
      <div className="whitespace-pre-line">{decodedContent}</div>
      <Button onClick={downloadPdf}>Download as PDF</Button>
    </div>
  );
}

