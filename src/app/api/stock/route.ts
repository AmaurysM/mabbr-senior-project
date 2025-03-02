import { NextResponse } from 'next/server';
import yahooFinance from 'yahoo-finance2';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol') || 'NVDA';

  try {
    const queryOptions = {
      lang: 'en-US',
      reportsCount: 1,
      modulesList: ['price']
    };

    const result = await yahooFinance.quote(symbol, queryOptions, {
      validateResult: false
    });

    const transformedData = {
      quoteResponse: {
        result: [{
          regularMarketPrice: result.regularMarketPrice,
          regularMarketChange: result.regularMarketChange,
          regularMarketChangePercent: result.regularMarketChangePercent,
          timestamp: Date.now(),
        }]
      }

      
    }

    return NextResponse.json(transformedData);
  } catch (error) {
    console.error('Yahoo Finance API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch stock data' }, { status: 500 });
  }
} 