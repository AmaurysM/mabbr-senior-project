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
      modules: ['financialData'] // Corrected `modulesList` -> `modules`
    };

    const result = await yahooFinance.quote(symbol, queryOptions, {
      validateResult: false
    });

    if (!result) {
      return NextResponse.json({ error: 'No data found for the given symbol' }, { status: 404 });
    }

    const transformedData = {
      analystResponse: {
        result: [{
          averageAnalystRating: result?.averageAnalystRating ?? 'N/A',
          recommendationMean: result?.financialData?.recommendationMean ?? null,
          recommendationKey: result?.financialData?.recommendationKey ?? null,
          numberOfAnalystOpinions: result?.financialData?.numberOfAnalystOpinions ?? 0,
          timestamp: Date.now(),
        }]
      }
    };
    return NextResponse.json(transformedData);
  } catch (error) {
    console.error('Yahoo Finance Analyst API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch analyst data' }, { status: 500 });
  }
}
