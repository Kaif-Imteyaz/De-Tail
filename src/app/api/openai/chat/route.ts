import { OpenAIStream, StreamingTextResponse } from 'ai';
import { NextResponse } from 'next/server';

export const maxDuration = 300; // Increased to 5 minutes for longer conversations
export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const { messages, apiKey } = await req.json();

    console.log('Received request with API key:', apiKey ? 'Present' : 'Missing');
    console.log('Messages count:', messages.length);

    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key is required' },
        { status: 400 }
      );
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages,
        stream: true,
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API Error:', response.status, errorText);
      
      return NextResponse.json(
        { 
          error: 'OpenAI API request failed',
          details: errorText,
          status: response.status
        },
        { status: response.status }
      );
    }

    // Create a stream from the OpenAI response
    const stream = OpenAIStream(response);

    // Return a StreamingTextResponse which will stream the response
    return new StreamingTextResponse(stream);

  } catch (error) {
    console.error('Internal Server Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}