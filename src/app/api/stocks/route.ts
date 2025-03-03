import { NextResponse } from 'next/server';
import yahooFinance from 'yahoo-finance2';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Create a simple cache to avoid redundant API calls
const cache: Record<string, { data: any, timestamp: number }> = {};
const CACHE_DURATION = 60000; // 1 minute cache

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbols = searchParams.get('symbols')?.split(',') || [];
  
  if (symbols.length === 0) {
    return NextResponse.json({ stocks: [] });
  }

  // Check cache first
  const now = Date.now();
  const cacheKey = symbols.sort().join(',');
  if (cache[cacheKey] && now - cache[cacheKey].timestamp < CACHE_DURATION) {
    return NextResponse.json({ stocks: cache[cacheKey].data });
  }

  try {
    // Batch fetch stock data
    const stocksData = await Promise.all(
      symbols.map(async (symbol) => {
        try {
          const result = await yahooFinance.quote(symbol, {
            lang: 'en-US',
            reportsCount: 1,
            modulesList: ['price']
          }, {
            validateResult: false
          });

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
            
            if (chartResult?.timestamps && Array.isArray(chartResult.timestamps)) {
              chartData = chartResult.timestamps.map((timestamp, index) => ({
                time: new Date(timestamp * 1000).toISOString(),
                price: chartResult.indicators.quote[0].close[index] || chartResult.indicators.quote[0].open[index]
              })).filter(item => item.price !== null);
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
          return null;
        }
      })
    );

    // Filter out failed requests
    const validStocks = stocksData.filter(Boolean);

    // Store in cache
    cache[cacheKey] = {
      data: validStocks,
      timestamp: now
    };

    return NextResponse.json({ stocks: validStocks });
  } catch (error) {
    console.error('Error fetching stock data:', error);
    return NextResponse.json({ error: 'Failed to fetch stock data' }, { status: 500 });
  }
} 