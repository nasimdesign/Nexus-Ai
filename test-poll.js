import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';
const pollinations = createOpenAI({
  baseURL: 'https://text.pollinations.ai/openai',
  apiKey: 'dummy',
});
// Need a quick way to test... wait, Next.js route has access to this.
