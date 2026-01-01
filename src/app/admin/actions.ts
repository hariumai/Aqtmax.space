'use server';

import { generateDescription } from '@/ai/flows/generate-description-flow';

/**
 * Server action to generate a product description using AI.
 * This action is called from the client-side admin panel.
 */
export async function generateDescriptionAction(productName: string): Promise<{
  success: boolean;
  description?: string;
  error?: string;
}> {
  try {
    const result = await generateDescription({ productName });
    return { success: true, description: result.description };
  } catch (error: any) {
    return { success: false, error: error.message || 'An unknown error occurred.' };
  }
}
