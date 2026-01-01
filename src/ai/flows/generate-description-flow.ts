'use server';
/**
 * @fileOverview AI flow for generating product descriptions.
 *
 * This file defines a Genkit flow that takes a product name as input and
 * returns a compelling, SEO-friendly marketing description for it.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { geminiPro } from 'genkit/models';

// Define the schema for the flow's input.
const GenerateDescriptionInputSchema = z.object({
  productName: z.string().describe('The name of the product or subscription service.'),
});
export type GenerateDescriptionInput = z.infer<typeof GenerateDescriptionInputSchema>;

// Define the schema for the flow's output.
const GenerateDescriptionOutputSchema = z.object({
  description: z.string().describe('The generated marketing description for the product.'),
});
export type GenerateDescriptionOutput = z.infer<typeof GenerateDescriptionOutputSchema>;

// Define the prompt template that will be sent to the language model.
const generateDescriptionPrompt = ai.definePrompt({
  name: 'generateDescriptionPrompt',
  model: geminiPro,
  input: { schema: GenerateDescriptionInputSchema },
  output: { schema: GenerateDescriptionOutputSchema },
  prompt: `You are a professional marketing copywriter specializing in digital services.

Generate a short, appealing, and SEO-friendly marketing description for the following subscription service: {{{productName}}}.

The description should be concise (2-3 sentences), highlight the key benefits, and encourage users to buy.
`,
});

// Define the main flow for generating the description.
const generateDescriptionFlow = ai.defineFlow(
  {
    name: 'generateDescriptionFlow',
    inputSchema: GenerateDescriptionInputSchema,
    outputSchema: GenerateDescriptionOutputSchema,
  },
  async (input) => {
    // Execute the prompt with the given product name.
    const { output } = await generateDescriptionPrompt(input);

    // Ensure the output is not null before returning.
    if (!output) {
      throw new Error('The AI model did not return a valid description.');
    }
    
    return output;
  }
);

/**
 * An exported wrapper function to make the flow easily callable from server actions.
 * @param input The product name object.
 * @returns A promise that resolves to the generated description object.
 */
export async function generateDescription(
  input: GenerateDescriptionInput
): Promise<GenerateDescriptionOutput> {
  return generateDescriptionFlow(input);
}
