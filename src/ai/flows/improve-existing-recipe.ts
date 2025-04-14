'use server';
/**
 * @fileOverview This file defines a Genkit flow for improving existing biotech recipes.
 *
 * - improveExistingRecipe - A function that takes an existing recipe and suggests improvements.
 * - ImproveExistingRecipeInput - The input type for the improveExistingRecipe function.
 * - ImproveExistingRecipeOutput - The return type for the improveExistingRecipe function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const ImproveExistingRecipeInputSchema = z.object({
  existingRecipe: z.string().describe('The existing biotech recipe to improve.'),
  desiredOutcomes: z.string().describe('The desired outcomes or goals for the improved recipe.'),
});
export type ImproveExistingRecipeInput = z.infer<typeof ImproveExistingRecipeInputSchema>;

const ImproveExistingRecipeOutputSchema = z.object({
  improvedRecipe: z.string().describe('The improved biotech recipe with suggested changes in JSON format.'),
  explanation: z.string().describe('An explanation of the changes made and why they were suggested.'),
});
export type ImproveExistingRecipeOutput = z.infer<typeof ImproveExistingRecipeOutputSchema>;

export async function improveExistingRecipe(input: ImproveExistingRecipeInput): Promise<ImproveExistingRecipeOutput> {
  return improveExistingRecipeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'improveExistingRecipePrompt',
  input: {
    schema: z.object({
      existingRecipe: z.string().describe('The existing biotech recipe to improve.'),
      desiredOutcomes: z.string().describe('The desired outcomes or goals for the improved recipe.'),
    }),
  },
  output: {
    schema: z.object({
      improvedRecipe: z.string().describe('The improved biotech recipe with suggested changes in minified JSON format.'),
      explanation: z.string().describe('An explanation of the changes made and why they were suggested.'),
    }),
  },
  prompt: `You are an expert in biotechnology recipe optimization.
  You will analyze the provided existing recipe and suggest improvements to achieve the desired outcomes.
  Explain the reasoning behind each suggested change.  The output must be a minified JSON object formatted as follows:
  {
    "recipeName": "Recipe Name",
    "description": "A brief description of the recipe.",
    "version": "1.0",
    "author": "AI Assistant",
    "dateCreated": "YYYY-MM-DD",
    "Materials": [
      {
        "name": "Material Name",
        "quantity": "Quantity",
        "supplier": "Supplier"
      }
    ],
    "Procedure": [
      {
        "title": "Procedure Title",
        "steps": [
          "Step 1",
          "Step 2"
        ]
      }
    ],
    "Troubleshooting": [
      {
        "issue": "Issue Description",
        "solution": "Solution Description"
      }
    ],
    "Notes": [
      {
        "note": "Additional notes or considerations"
      }
    ]
  }
  Ensure that the JSON is valid and can be parsed without errors. Provide specific details for each material, step, issue, and note. The JSON MUST be minified.
  
  Existing Recipe:
  {{{existingRecipe}}}
  
  Desired Outcomes:
  {{{desiredOutcomes}}}
  
  Provide the improved recipe and a clear explanation of the changes you made.`,
});

const improveExistingRecipeFlow = ai.defineFlow<
  typeof ImproveExistingRecipeInputSchema,
  typeof ImproveExistingRecipeOutputSchema
>(
  {
    name: 'improveExistingRecipeFlow',
    inputSchema: ImproveExistingRecipeInputSchema,
    outputSchema: ImproveExistingRecipeOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
