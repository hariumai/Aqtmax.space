'use server';
/**
 * @fileOverview A support chat AI agent for the SubLime Marketplace.
 *
 * - askSupport - A function that takes a user's query and returns a helpful response.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import backendConfig from '@/../docs/backend.json';
import fs from 'fs';
import path from 'path';

// Read the contents of the legal pages and security rules directly from the filesystem.
const termsContent = fs.readFileSync(path.join(process.cwd(), 'src', 'app', '(legal)', 'terms', 'page.tsx'), 'utf8');
const privacyContent = fs.readFileSync(path.join(process.cwd(), 'src', 'app', '(legal)', 'privacy', 'page.tsx'), 'utf8');
const refundContent = fs.readFileSync(path.join(process.cwd(), 'src', 'app', '(legal)', 'refund', 'page.tsx'), 'utf8');
const securityRules = fs.readFileSync(path.join(process.cwd(), 'firestore.rules'),'utf8');


// A simple regex to strip out the component parts of the legal pages
const pageContentRegex = /<div[^>]*>([\s\S]*?)<\/div>/;

const extractContent = (rawContent: string): string => {
    if (!rawContent) return '';
    const match = rawContent.match(pageContentRegex);
    // Remove HTML tags and extra whitespace
    return match ? match[1].replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() : '';
};

// Define the input schema for the support flow
const SupportChatInputSchema = z.object({
  query: z.string(),
  userContext: z
    .object({
      userProfile: z.any().optional(),
      userOrders: z.any().array().optional(),
    })
    .optional(),
});
export type SupportChatInput = z.infer<typeof SupportChatInputSchema>;


// Define the output schema for the support flow
const SupportChatOutputSchema = z.string();

// Define the main function that will be called from the UI
export async function askSupport(input: SupportChatInput): Promise<z.infer<typeof SupportChatOutputSchema>> {
  const result = await supportChatFlow(input);
  return result;
}

// Define the Genkit prompt
const supportPrompt = ai.definePrompt({
  name: 'supportChatPrompt',
  input: { schema: z.object({
    query: z.string(),
    userContextString: z.string().optional(),
  }) },
  output: { schema: SupportChatOutputSchema },
  system: `You are a friendly and helpful AI support agent for a digital marketplace called "SubLime Marketplace". Your goal is to assist users with their questions about the platform, their orders, subscriptions, and company policies.

You MUST be concise and to the point. Answer the user's question directly based on the context provided. Do not invent information.

{{#if userContextString}}
You are speaking to a logged-in user. Here is their information:
{{{userContextString}}}

Use this information to answer their questions specifically (e.g., "What was my last order?", "What's my store credit balance?").
{{else}}
You are speaking to a guest who is not logged in.
{{/if}}

You have been provided with the following context about the application:

1. Data Structure (backend.json): This defines all the data entities in the system, like Users, Orders, and Subscriptions. Use this to understand what information is stored.
   \`\`\`json
   {{{dataStructure}}}
   \`\`\`

2. Security Rules (firestore.rules): This defines who can read and write data. Use this to explain permissions and data security.
   \`\`\`
   {{{securityRules}}}
   \`\`\`

3. Legal Documents: Use these to answer questions about terms, privacy, and refunds.
   - Terms of Service: {{{terms}}}
   - Privacy Policy: {{{privacy}}}
   - Refund Policy: {{{refund}}}

4. General Knowledge: The marketplace sells digital subscriptions like Netflix, Spotify, etc. 
   - To buy something, a user adds a product to their cart. They can then go to the checkout page.
   - At checkout, they can apply any available store credit.
   - For any remaining balance, they must perform a bank transfer to the details provided and upload a screenshot of the payment.
   - An admin then verifies the payment and completes the order.
   - When an order is 'completed', the user receives the subscription credentials on their profile page.
   - Admins can ban users for violating terms of service.
   - Users can appeal a ban.

Based on this information, please answer the user's query.`,
});

// Define the Genkit flow
const supportChatFlow = ai.defineFlow(
  {
    name: 'supportChatFlow',
    inputSchema: SupportChatInputSchema,
    outputSchema: SupportChatOutputSchema,
  },
  async (input) => {
    // Rule-based logic for logged-in users
    if (input.userContext?.userProfile) {
      const lowerQuery = input.query.toLowerCase();

      // Rule for store credit
      if (lowerQuery.includes('store credit')) {
        const credit = input.userContext.userProfile.storeCredit?.toFixed(2) || '0.00';
        return `Your current store credit balance is ${credit} PKR.`;
      }

      // Rule for tracking orders
      if (lowerQuery.includes('order') || lowerQuery.includes('track')) {
        const orders = input.userContext.userOrders;
        if (!orders || orders.length === 0) {
          return "You haven't placed any orders yet. Feel free to browse our products!";
        }
        
        const recentOrders = orders.slice(0, 3);
        let response = `Here are your most recent orders:\n`;
        recentOrders.forEach((order: any, index: number) => {
          const itemNames = order.items.map((item: any) => item.subscriptionName).join(', ');
          response += `\n${index + 1}. ${itemNames} - Status: ${order.status}`;
        });
        
        response += `\n\nFor more details, please visit your profile page.`;
        return response;
      }
    }

    // Fallback to Gemini for general queries
    let userContextString: string | undefined;
    if (input.userContext) {
      userContextString = `
- User Profile: ${JSON.stringify(input.userContext.userProfile, null, 2)}
- User Orders: ${JSON.stringify(input.userContext.userOrders, null, 2)}
      `;
    }

    const { output } = await supportPrompt({ query: input.query, userContextString }, {
      dataStructure: JSON.stringify(backendConfig, null, 2),
      securityRules,
      terms: extractContent(termsContent),
      privacy: extractContent(privacyContent),
      refund: extractContent(refundContent),
    });
    
    return output!;
  }
);
