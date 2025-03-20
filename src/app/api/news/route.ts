import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { AlphaVantageNews } from '@/lib/prisma_types';

const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours


export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = 5;
  const tickers = 'NVDA';

  if (page < 1) {
    return NextResponse.json({ error: 'Invalid page number' }, { status: 400 });
  }

  try {
    
    // Check for cached news
    const cachedNews:AlphaVantageNews|null = await prisma.alphaVantageNews.findFirst({
      where: {
        tickers,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (cachedNews) {
      console.log('Using cached Alpha Vantage news data');
      const data = cachedNews.data as { feed: { title: string; url: string; summary: string; ticker_sentiment: string[]; time_published: string; }[] };
      const startIdx = (page - 1) * pageSize;
      const paginatedNews = data.feed.slice(startIdx, startIdx + pageSize);

      return NextResponse.json({
        news: paginatedNews.map((item: { title: string; url: string; summary: string; ticker_sentiment: string[]; time_published: string; }) => ({
          title: item.title,
          url: item.url,
          summary: item.summary,
          tickers: item.ticker_sentiment || [],
          time: item.time_published,
        })),
        hasMore: startIdx + pageSize < data.feed.length,
      });
    }

    // Fetch fresh data if no cache exists
    console.log('Fetching fresh Alpha Vantage news data');
    const url = `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers=${tickers}&apikey=${ALPHA_VANTAGE_API_KEY}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'API request failed' }, { status: response.status });
    }

    const data = await response.json();
    if (!data.feed) {
      return NextResponse.json({ error: 'Invalid API response structure' }, { status: 400 });
    }

    // Store fresh data in the database
    const expiresAt = new Date(Date.now() + CACHE_DURATION_MS);
    await prisma.alphaVantageNews.create({
      data: { tickers, data, expiresAt },
    });

    // Return paginated news
    const startIdx = (page - 1) * pageSize;
    const paginatedNews = data.feed.slice(startIdx, startIdx + pageSize);

    return NextResponse.json({
      news: paginatedNews.map((item: { title: string; url: string; summary: string; ticker_sentiment: string[]; time_published: string; }) => ({
        title: item.title,
        url: item.url,
        summary: item.summary,
        tickers: item.ticker_sentiment || [],
        time: item.time_published,
      })),
      hasMore: startIdx + pageSize < data.feed.length,
    });

  } catch (error) {
    console.error('News API error:', error);
    return NextResponse.json({ error: 'Failed to fetch news' }, { status: 500 });
  }
}
