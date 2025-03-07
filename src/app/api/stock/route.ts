import { NextResponse } from 'next/server';
import yahooFinance from 'yahoo-finance2';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol') || 'NVDA';

  try {
    const result = await yahooFinance.quoteSummary(symbol, {
      modules: [
        'price',
        'summaryDetail',
        'financialData',
        'defaultKeyStatistics',
        'assetProfile'
      ]
    });

    const transformedData = {
      quoteResponse: {
        result: [{
          // Basic data
          symbol: symbol,
          regularMarketPrice: result.price?.regularMarketPrice,
          regularMarketChange: result.price?.regularMarketChange,
          regularMarketChangePercent: result.price?.regularMarketChangePercent,
          regularMarketVolume: result.price?.regularMarketVolume,
          
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

    return NextResponse.json(transformedData);
  } catch (error) {
    console.error('Yahoo Finance API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch stock data' }, { status: 500 });
  }
} 