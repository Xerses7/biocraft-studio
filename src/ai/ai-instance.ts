import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import { serverConfig } from '@/server/config';

export const ai = genkit({
  promptDir: './prompts',
  plugins: [
    googleAI({
      apiKey: serverConfig.ai.googleApiKey,
    }),
  ],
  model: 'googleai/gemini-2.5-flash',
});
