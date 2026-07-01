import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

const openrouter = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: "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"
});

async function main() {
  try {
    const result = await streamText({
      model: openrouter('openai/gpt-4o-mini'),
      messages: [{ role: "user", content: "hi" }]
    });
    for await (const chunk of result.textStream) {
      process.stdout.write(chunk);
    }
  } catch (e) {
    console.error(e);
  }
}
main();
