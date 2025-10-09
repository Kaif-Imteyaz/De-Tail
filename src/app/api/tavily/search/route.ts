import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const apiKey = searchParams.get('apiKey');

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      );
    }

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Tavily API key is required' },
        { status: 400 }
      );
    }

    console.log('Searching Tavily for:', query);

    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        search_depth: "advanced",
        include_answers: true,
        include_domains: [],
        exclude_domains: [],
        max_results: 5,
        api_key: apiKey,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Tavily API error: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Tavily results:', data.results?.length);
    return NextResponse.json({ results: data.results });
  } catch (error) {
    console.error('Tavily API Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch search results',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}