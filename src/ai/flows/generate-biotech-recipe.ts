'use server';
/**
 * @fileOverview Generates biotech recipes based on user-specified ingredients and desired outcomes.
 *
 * - generateBiotechRecipe - A function that generates a biotech recipe.
 * - GenerateBiotechRecipeInput - The input type for the generateBiotechRecipe function.
 * - GenerateBiotechRecipeOutput - The return type for the generateBiotechRecipe function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const GenerateBiotechRecipeInputSchema = z.object({
  ingredients: z.string().describe('List of ingredients for the recipe.'),
  desiredOutcome: z.string().describe('The desired outcome of the recipe.'),
});
export type GenerateBiotechRecipeInput = z.infer<typeof GenerateBiotechRecipeInputSchema>;

const GenerateBiotechRecipeOutputSchema = z.object({
  recipe: z.string().describe('The generated biotech recipe in JSON format.'),
});
export type GenerateBiotechRecipeOutput = z.infer<typeof GenerateBiotechRecipeOutputSchema>;

export async function generateBiotechRecipe(input: GenerateBiotechRecipeInput): Promise<GenerateBiotechRecipeOutput> {
  return generateBiotechRecipeFlow(input);
}

const generateBiotechRecipePrompt = ai.definePrompt({
  name: 'generateBiotechRecipePrompt',
  input: {
    schema: z.object({
      ingredients: z.string().describe('List of ingredients for the recipe.'),
      desiredOutcome: z.string().describe('The desired outcome of the recipe.'),
    }),
  },
  output: {
    schema: z.object({
      recipe: z.string().describe('The generated biotech recipe in minified JSON format following a specific schema.'),
    }),
  },
  prompt: `You are an expert in biotechnology and recipe generation. Based on the provided ingredients and desired outcome, generate a novel and detailed biotech recipe.
  The output must be a minified JSON object formatted as follows:
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
  
  Ensure that the JSON is valid and can be parsed without errors. Provide specific details for each material, step, issue, and note.  The JSON MUST be minified.
  
  Ingredients: {{{ingredients}}}
  Desired Outcome: {{{desiredOutcome}}}
  
  Recipe:`,
});

const generateBiotechRecipeFlow = ai.defineFlow<
  typeof GenerateBiotechRecipeInputSchema,
  typeof GenerateBiotechRecipeOutputSchema
>({
  name: 'generateBiotechRecipeFlow',
  inputSchema: GenerateBiotechRecipeInputSchema,
  outputSchema: GenerateBiotechRecipeOutputSchema,
},
async input => {
  const {output} = await generateBiotechRecipePrompt(input);
  return output!;
});
