import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { AlphaVantageNews } from '@/lib/prisma_types';

const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

function normalizeUrl(url: string): string {
  url = url.replace(/^(https?:)\/(?!\/)/, '$1//');
  return url.replace(/\/+$/, '');
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ all: string[] }> }
) {
  const { all } = await params;
  const url = all.join('/');
  console.log(url, "inside GET");

  if (!url) {
    return NextResponse.json(
      { error: 'URL parameter is required' },
      { status: 400 }
    );
  }

  try {
    const cachedNews: AlphaVantageNews | null =
      await prisma.alphaVantageNews.findFirst({
        where: {
          expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: 'desc' },
      });

    const normalizedRouteUrl = normalizeUrl(url);

    if (cachedNews) {
      console.log('Using cached Alpha Vantage news data');
      const data = cachedNews.data as {
        feed: {
          title: string;
          url: string;
          summary: string;
          ticker_sentiment: string[];
          time_published: string;
        }[];
      };

      const filteredNews = data.feed.filter((item) =>
        normalizeUrl(item.url).includes(normalizedRouteUrl)
      );

      return NextResponse.json({
        news: filteredNews.map((item) => ({
          title: item.title,
          url: item.url,
          summary: item.summary,
          tickers: item.ticker_sentiment || [],
          time: item.time_published,
        })),
      });
    }

    console.log('Fetching fresh Alpha Vantage news data');
    const apiUrl = `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&apikey=${ALPHA_VANTAGE_API_KEY}`;

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'API request failed' },
        { status: response.status }
      );
    }

    const data = await response.json();
    if (!data.feed) {
      return NextResponse.json(
        { error: 'Invalid API response structure' },
        { status: 400 }
      );
    }

    const expiresAt = new Date(Date.now() + CACHE_DURATION_MS);
    await prisma.alphaVantageNews.create({
      data: { tickers: '', data, expiresAt },
    });

    const filteredNews = data.feed.filter((item: { url: string }) =>
      normalizeUrl(item.url).includes(normalizedRouteUrl)
    );

    if (filteredNews.length === 0) {
      return NextResponse.json(
        { error: 'No news found for the provided URL' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      news: filteredNews.map((item: {
        title: string;
        url: string;
        summary: string;
        ticker_sentiment: string[];
        time_published: string;
      }) => ({
        title: item.title,
        url: item.url,
        summary: item.summary,
        tickers: item.ticker_sentiment || [],
        time: item.time_published,
      })),
    });
  } catch (error) {
    console.error('News API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch news' },
      { status: 500 }
    );
  }
}
