import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// NOTE: After adding the AlphaVantageNews model to schema.prisma,
// you must run 'npx prisma generate' to update the Prisma client types.
// Otherwise, TypeScript will show errors for the alphaVantageNews property.

const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

// Cache duration in milliseconds (24 hours)
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000;

// Type definitions to work around Prisma client generation issues
type PrismaWithAlphaVantageNews = typeof prisma & {
  alphaVantageNews: {
    findFirst: (args: any) => Promise<any>;
    create: (args: any) => Promise<any>;
  }
};

export async function GET() {
  const tickers = 'NVDA'; // Default tickers
  
  try {
    // Use type assertion to avoid TypeScript errors
    const prismaWithNews = prisma as PrismaWithAlphaVantageNews;
    
    // Check if we have a valid cached response
    const cachedNews = await prismaWithNews.alphaVantageNews.findFirst({
      where: {
        tickers,
        expiresAt: {
          gt: new Date() // Not expired yet
        }
      },
      orderBy: {
        createdAt: 'desc' // Get the most recent
      }
    });

    // If we have valid cached data, use it
    if (cachedNews) {
      console.log('Using cached Alpha Vantage news data');
      const data = cachedNews.data as any;
      
      // Process only if we have news items
      const newsItems = data.feed.slice(0, 5).map((item: any) => ({
        title: item.title,
        url: item.url,
        summary: item.summary,
        tickers: item.ticker_sentiment || [],
        time: item.time_published
      }));

      return NextResponse.json({ news: newsItems });
    }
    
    // If no valid cache, fetch from Alpha Vantage
    console.log('Fetching fresh Alpha Vantage news data');
    const url = `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers=${tickers}&apikey=${ALPHA_VANTAGE_API_KEY}`;
    
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

    // Calculate expiration time (24 hours from now)
    const expiresAt = new Date(Date.now() + CACHE_DURATION_MS);
    
    // Store the response in the database for future use
    await prismaWithNews.alphaVantageNews.create({
      data: {
        tickers,
        data: data,
        expiresAt,
      }
    });

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