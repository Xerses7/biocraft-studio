'use client';

import { useSearchParams } from 'next/navigation';

export default function RecipePage() {
  const searchParams = useSearchParams();
  const content = searchParams.get('content');

  if (!content) {
    return <div>No recipe content found.</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Recipe Details</h1>
      <div className="whitespace-pre-line">{decodeURIComponent(content)}</div>
    </div>
  );
}
