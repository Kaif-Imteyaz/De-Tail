import { OpenAI } from 'openai';
import { OpenAIStream, StreamingTextResponse } from 'ai';

const client = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: 'https://api.deepseek.com',
});

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const response = await client.chat.completions.create({
      model: 'deepseek-chat',
      messages,
      stream: true,
      temperature: 0.7,
      max_tokens: 1000,
    });

    // Ensure OpenAIStream processes DeepSeek response correctly
    const stream = OpenAIStream(response, {
      async *onToken(chunk: { choices: Array<{ delta: { content?: string } }> }) {
        yield chunk.choices[0]?.delta?.content ?? "";
      },
    });

    return new StreamingTextResponse(stream);
  } catch (error) {
    console.error('DeepSeek API Error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate response' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
