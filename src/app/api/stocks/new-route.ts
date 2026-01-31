import { NextRequest, NextResponse } from 'next/server';
import { yahooFinance } from "@/lib/yahooFinance";
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Create a simple cache to avoid redundant API calls
const cache: Record<string, { data: any, timestamp: number }> = {};
const CACHE_DURATION = 60000; // 1 minute cache

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const symbols = searchParams.get('symbols')?.split(',') || [];
    
    if (symbols.length === 0) {
      try {
        const stocks = await prisma.stock.findMany();
        return NextResponse.json({ stocks });
      } catch (error) {
        console.error('Error fetching stocks from database:', error);
        return NextResponse.json({ stocks: [] });
      }
    }

    // Check cache first
    const now = Date.now();
    const cacheKey = symbols.sort().join(',');
    if (cache[cacheKey] && now - cache[cacheKey].timestamp < CACHE_DURATION) {
      return NextResponse.json({ stocks: cache[cacheKey].data });
    }

    // Batch fetch stock data from Yahoo Finance
    const stocksData = await Promise.all(
      symbols.map(async (symbol) => {
        try {
          const result = await yahooFinance.quote(symbol);
          if (!result) {
            throw new Error(`No data returned for ${symbol}`);
          }

          // Get chart data
          const endDate = new Date();
          const startDate = new Date();
          startDate.setDate(startDate.getDate() - 5);
          
          let chartData = [];
          try {
            const chartResult = await yahooFinance.chart(symbol, {
              period1: startDate,
              period2: endDate,
              interval: '1h'
            });
            
            if (chartResult?.quotes && Array.isArray(chartResult.quotes)) {
              chartData = chartResult.quotes
                .filter(quote => quote.close !== null)
                .map(quote => ({
                  time: new Date(quote.date).toISOString(),
                  price: quote.close || quote.open || 0
                }));
            }
          } catch (chartError) {
            console.error('Error fetching chart data:', chartError);
            // Generate mock chart data as fallback
            chartData = Array(24).fill(0).map((_, i) => {
              const date = new Date(startDate);
              date.setHours(date.getHours() + i);
              return {
                time: date.toISOString(),
                price: result.regularMarketPrice + (Math.random() * 2 - 1) * (result.regularMarketPrice * 0.01)
              };
            });
          }

          return {
            symbol: symbol,
            name: result.shortName || symbol,
            price: result.regularMarketPrice || 0,
            change: result.regularMarketChange || 0,
            changePercent: result.regularMarketChangePercent || 0,
            chartData
          };
        } catch (error) {
          console.error(`Error fetching data for ${symbol}:`, error);
          
          // Try to get from database as fallback
          try {
            const dbStock = await prisma.stock.findFirst({
              where: { 
                name: symbol 
              }
            });
            
            if (!dbStock) {
              return null;
            }

            return {
              symbol: symbol,
              name: dbStock.name,
              price: 0,
              change: 0,
              changePercent: 0,
              chartData: []
            };
          } catch (dbError) {
            console.error(`Error fetching from database for ${symbol}:`, dbError);
            return null;
          }
        }
      })
    );

    // Filter out failed requests
    const validStocks = stocksData.filter(Boolean);

    if (validStocks.length === 0) {
      return NextResponse.json({ stocks: [] });
    }

    // Store in cache
    cache[cacheKey] = {
      data: validStocks,
      timestamp: now
    };

    return NextResponse.json({ stocks: validStocks });
  } catch (error) {
    console.error('Error fetching stock data:', error);
    return NextResponse.json({ stocks: [] });
  }
}

// CREATE a new stock (keeping this for manual stock creation if needed)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    const newStock = await prisma.stock.create({
      data: { name }
    });

    return NextResponse.json(newStock, { status: 201 });
  } catch (error) {
    console.error('Error creating stock:', error);
    return NextResponse.json(
      { error: 'Failed to create stock' },
      { status: 500 }
    );
  }
} 