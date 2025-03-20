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

    if (!messages || !Array.isArray(messages)) {
      return new Response('Invalid messages format', { status: 400 });
    }

    // Add system message to enforce reasoning format
    const systemMessage = {
      role: 'system',
      content: `You are an AI assistant that specializes in step-by-step reasoning and providing well-supported answers. 
      Your response must follow this exact format:

      Step-by-step reasoning:
      [Your detailed reasoning process, including:
      1. Analysis of the question
      2. Key points from the search results
      3. Logical connections and deductions
      4. Consideration of different perspectives
      5. Final synthesis]

      Final Answer:
      [Your concise, well-supported answer based on the reasoning above]

      Guidelines:
      1. Break down your reasoning into clear, logical steps
      2. Use specific information from the search results to support your reasoning
      3. Consider multiple perspectives when relevant
      4. Provide a clear, concise final answer that directly addresses the question
      5. Always maintain this exact format with the headers "Step-by-step reasoning:" and "Final Answer:"
      6. Keep the reasoning section detailed but organized
      7. Make the final answer concise and actionable`
    };

    console.log('Sending request to DeepSeek API...');
    console.log('Messages:', JSON.stringify([systemMessage, ...messages], null, 2));

    const response = await client.chat.completions.create({
      model: 'deepseek-chat',
      messages: [systemMessage, ...messages],
      stream: true,
      temperature: 0.7,
      max_tokens: 2000,
    });

    console.log('Received response from DeepSeek API');

    // Convert the response into a friendly text-stream
    const stream = OpenAIStream(response as any);
    
    return new StreamingTextResponse(stream);
  } catch (error) {
    console.error('DeepSeek API Error:', error);
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    return new Response(
      JSON.stringify({ 
        error: 'Failed to process chat request',
        details: error instanceof Error ? error.message : 'Unknown error',
        type: error instanceof Error ? error.name : 'Unknown'
      }), 
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );
  }
}
