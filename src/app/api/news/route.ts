import { NextResponse } from 'next/server';

const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

export async function GET() {
  try {
    // Use node-fetch options to ensure proper headers
    const url = `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers=NVDA&apikey=${ALPHA_VANTAGE_API_KEY}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Get the response as text first
    const text = await response.text();
    console.log('Raw API Response:', text.substring(0, 500)); // Log first 500 chars

    // Try parsing the text
    try {
      const data = JSON.parse(text);
      
      // Check if we have the expected data structure
      if (!data.feed) {
        return NextResponse.json({
          error: 'No news feed in response',
          data: data // Include the full response for debugging
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

    } catch (parseError) {
      console.error('Parse error:', parseError);
      return NextResponse.json({
        error: 'Failed to parse API response',
        rawResponse: text.substring(0, 500) // Include start of raw response
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Fetch error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch news',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 