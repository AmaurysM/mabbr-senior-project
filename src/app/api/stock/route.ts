import { NextResponse } from 'next/server';
import yahooFinance from '@/lib/yahooFinance';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol') || 'NVDA';

  try {
    console.log(`Fetching data for symbol: ${symbol}`);
    const result = await yahooFinance.quoteSummary(symbol, {
      modules: [
        'price',
        'summaryDetail',
        'financialData',
        'defaultKeyStatistics',
        'assetProfile'
      ]
    });

    if (!result) {
      console.error('No data returned from Yahoo Finance');
      return NextResponse.json({ error: 'No data available' }, { status: 404 });
    }

    console.log('Yahoo Finance raw response:', JSON.stringify(result, null, 2));

    const transformedData = {
      quoteResponse: {
        result: [{
          // Basic data
          symbol: symbol,
          regularMarketPrice: result.price?.regularMarketPrice,
          regularMarketChange: result.price?.regularMarketChange,
          regularMarketChangePercent: result.price?.regularMarketChangePercent,
          regularMarketVolume: result.price?.regularMarketVolume,
          regularMarketOpen: result.price?.regularMarketOpen,
          regularMarketDayHigh: result.price?.regularMarketDayHigh,
          regularMarketDayLow: result.price?.regularMarketDayLow,
          regularMarketPreviousClose: result.price?.regularMarketPreviousClose,
          
          // Summary details
          marketCap: result.summaryDetail?.marketCap,
          trailingPE: result.summaryDetail?.trailingPE,
          dividendYield: result.summaryDetail?.dividendYield,
          averageVolume: result.summaryDetail?.averageVolume,
          fiftyTwoWeekHigh: result.summaryDetail?.fiftyTwoWeekHigh,
          fiftyTwoWeekLow: result.summaryDetail?.fiftyTwoWeekLow,
          
          // Financial data
          targetMeanPrice: result.financialData?.targetMeanPrice,
          profitMargins: result.financialData?.profitMargins,
          operatingMargins: result.financialData?.operatingMargins,
          returnOnAssets: result.financialData?.returnOnAssets,
          returnOnEquity: result.financialData?.returnOnEquity,
          
          // Key statistics
          enterpriseValue: result.defaultKeyStatistics?.enterpriseValue,
          forwardPE: result.defaultKeyStatistics?.forwardPE,
          earningsPerShare: result.defaultKeyStatistics?.trailingEps,
          bookValue: result.defaultKeyStatistics?.bookValue,
          
          // Company profile
          longName: result.price?.longName,
          shortName: result.price?.shortName,
          sector: result.assetProfile?.sector,
          industry: result.assetProfile?.industry,
          website: result.assetProfile?.website,
          longBusinessSummary: result.assetProfile?.longBusinessSummary,
          
          // Analyst recommendations
          recommendationMean: result.financialData?.recommendationMean,
          recommendationKey: result.financialData?.recommendationKey,
          numberOfAnalystOpinions: result.financialData?.numberOfAnalystOpinions,
          
          timestamp: Date.now(),
        }]
      }
    };

    console.log('Transformed data:', JSON.stringify(transformedData, null, 2));
    return NextResponse.json(transformedData);
  } catch (error) {
    console.error('Yahoo Finance API Error:', error);
    // More detailed error response
    return NextResponse.json({ 
      error: 'Failed to fetch stock data',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: Date.now()
    }, { status: 500 });
  }
} 