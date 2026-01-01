/**
 * @fileoverview This file initializes the Genkit AI instance with necessary plugins.
 * It ensures that the AI capabilities are configured and ready for use throughout the application.
 */

import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

// Initialize the Genkit AI instance with the Google AI plugin.
// This makes Google's generative models available for use in AI flows.
// The `ai` object is exported to be used for defining prompts, flows, and other AI functionalities.
export const ai = genkit({
  plugins: [
    googleAI(),
  ],
});
