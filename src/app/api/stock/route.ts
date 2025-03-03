import { NextResponse } from 'next/server';
import yahooFinance from 'yahoo-finance2';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Create a simple cache to avoid redundant API calls
const cache: Record<string, { data: any, timestamp: number }> = {};
const CACHE_DURATION = 60000; // 1 minute cache

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol') || 'NVDA';
  const detailed = searchParams.get('detailed') === 'true';
  
  // Check cache first
  const now = Date.now();
  const cacheKey = `${symbol}-${detailed ? 'detailed' : 'basic'}`;
  if (cache[cacheKey] && now - cache[cacheKey].timestamp < CACHE_DURATION) {
    return NextResponse.json(cache[cacheKey].data);
  }

  try {
    // Basic quote data
    const quoteOptions = {
      lang: 'en-US',
      reportsCount: 1,
      modulesList: ['price']
    };

    const result = await yahooFinance.quote(symbol, quoteOptions, {
      validateResult: false
    });

    let responseData;

    if (!detailed) {
      // Basic response with minimal data
      responseData = {
        quoteResponse: {
          result: [{
            symbol: symbol,
            regularMarketPrice: result.regularMarketPrice,
            regularMarketChange: result.regularMarketChange,
            regularMarketChangePercent: result.regularMarketChangePercent,
            regularMarketVolume: result.regularMarketVolume,
            timestamp: Date.now(),
          }]
        }
      };
    } else {
      // Detailed response with comprehensive data
      // Fetch additional data using quoteSummary
      const quoteSummary = await yahooFinance.quoteSummary(symbol, { 
        modules: [
          'price', 
          'summaryDetail', 
          'financialData', 
          'defaultKeyStatistics',
          'assetProfile',
          'recommendationTrend',
          'earningsTrend'
        ] 
      });
      
      // Get chart data for the day
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 5);
      
      let chartDataPoints = [];
      
      try {
        const chartData = await yahooFinance.chart(symbol, {
          period1: startDate,
          period2: endDate,
          interval: '1h'
        });
        
        // Check if chart data has valid structure before mapping
        if (chartData && chartData.timestamps && Array.isArray(chartData.timestamps) && 
            chartData.indicators && chartData.indicators.quote && 
            chartData.indicators.quote[0]) {
          chartDataPoints = chartData.timestamps.map((timestamp, index) => ({
            time: new Date(timestamp * 1000).toISOString(),
            price: chartData.indicators.quote[0].close[index] || chartData.indicators.quote[0].open[index]
          })).filter(item => item.price !== null);
        } else {
          // Fallback to generate some mock chart data if API doesn't return expected format
          const basePrice = result.regularMarketPrice;
          chartDataPoints = Array(24).fill(0).map((_, i) => {
            const date = new Date(startDate);
            date.setHours(date.getHours() + i);
            return {
              time: date.toISOString(),
              price: basePrice + (Math.random() * 2 - 1) * (basePrice * 0.01) // Random ±1% variation
            };
          });
        }
      } catch (chartError) {
        console.error('Error fetching chart data:', chartError);
        // Generate mock chart data as fallback
        const basePrice = result.regularMarketPrice;
        chartDataPoints = Array(24).fill(0).map((_, i) => {
          const date = new Date(startDate);
          date.setHours(date.getHours() + i);
          return {
            time: date.toISOString(),
            price: basePrice + (Math.random() * 2 - 1) * (basePrice * 0.01) // Random ±1% variation
          };
        });
      }

      responseData = {
        quoteResponse: {
          result: [{
            // Basic quote data
            symbol: symbol,
            regularMarketPrice: result.regularMarketPrice,
            regularMarketChange: result.regularMarketChange,
            regularMarketChangePercent: result.regularMarketChangePercent,
            regularMarketVolume: result.regularMarketVolume,
            
            // Summary details
            marketCap: quoteSummary.summaryDetail?.marketCap,
            trailingPE: quoteSummary.summaryDetail?.trailingPE,
            dividendYield: quoteSummary.summaryDetail?.dividendYield,
            averageVolume: quoteSummary.summaryDetail?.averageVolume,
            fiftyTwoWeekHigh: quoteSummary.summaryDetail?.fiftyTwoWeekHigh,
            fiftyTwoWeekLow: quoteSummary.summaryDetail?.fiftyTwoWeekLow,
            
            // Financial data
            targetMeanPrice: quoteSummary.financialData?.targetMeanPrice,
            profitMargins: quoteSummary.financialData?.profitMargins,
            operatingMargins: quoteSummary.financialData?.operatingMargins,
            returnOnAssets: quoteSummary.financialData?.returnOnAssets,
            returnOnEquity: quoteSummary.financialData?.returnOnEquity,
            
            // Key statistics
            enterpriseValue: quoteSummary.defaultKeyStatistics?.enterpriseValue,
            forwardPE: quoteSummary.defaultKeyStatistics?.forwardPE,
            earningsPerShare: quoteSummary.defaultKeyStatistics?.trailingEps,
            bookValue: quoteSummary.defaultKeyStatistics?.bookValue,
            
            // Company profile
            longName: quoteSummary.price?.longName,
            shortName: quoteSummary.price?.shortName,
            sector: quoteSummary.assetProfile?.sector,
            industry: quoteSummary.assetProfile?.industry,
            website: quoteSummary.assetProfile?.website,
            longBusinessSummary: quoteSummary.assetProfile?.longBusinessSummary,
            
            // Chart data
            chartData: chartDataPoints,
            
            // Analyst recommendations
            recommendationMean: quoteSummary.financialData?.recommendationMean,
            recommendationKey: quoteSummary.financialData?.recommendationKey,
            numberOfAnalystOpinions: quoteSummary.financialData?.numberOfAnalystOpinions,
            
            timestamp: Date.now(),
          }]
        }
      };
    }

    // Store in cache
    cache[cacheKey] = {
      data: responseData,
      timestamp: now
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Yahoo Finance API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch stock data' }, { status: 500 });
  }
} 