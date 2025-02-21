import { NextResponse } from 'next/server';

const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

export async function GET() {
  try {
    const url = `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers=NVDA&apikey=${ALPHA_VANTAGE_API_KEY}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'application/json'
      }
    });

    // Check content type and status
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.error('Invalid content type:', contentType);
      return NextResponse.json({ 
        error: 'Invalid response type from API',
        details: `Expected JSON but got ${contentType}`
      }, { status: 500 });
    }

    if (!response.ok) {
      console.error('API response not OK:', response.status, response.statusText);
      return NextResponse.json({ 
        error: 'API request failed',
        details: `Status: ${response.status}`
      }, { status: response.status });
    }

    const data = await response.json();
    
    // Check if we have the expected data structure
    if (!data.feed) {
      console.error('Unexpected data structure:', data);
      return NextResponse.json({
        error: 'Invalid API response structure',
        details: 'No news feed found in response'
      }, { status: 400 });
    }

    // Process only if we have news items
    const newsItems = data.feed.slice(0, 5).map((item: any) => ({
      title: item.title,
      url: item.url,
      summary: item.summary,
      tickers: item.ticker_sentiment || [],
      time: item.time_published
    }));

    return NextResponse.json({ news: newsItems });

  } catch (error) {
    console.error('News API error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch news',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 