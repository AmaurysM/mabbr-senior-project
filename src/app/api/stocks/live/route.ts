// app/api/stock/live/route.ts
import { NextResponse } from "next/server";
import yahooFinance from "yahoo-finance2";

const validIntervals = [
  "1d",
  "1m",
  "2m",
  "5m",
  "15m",
  "30m",
  "60m",
  "90m",
  "1h",
  "5d",
  "1wk",
  "1mo",
  "3mo",
] as const;

export interface TransformedStockData {
  symbol?: string;
  longName?: string;
  shortName?: string;
  sector?: string;
  industry?: string;
  website?: string;
  longBusinessSummary?: string;
  marketCap?: number;
  regularMarketPrice?: number;
  regularMarketChange?: number;
  regularMarketChangePercent?: number;
  regularMarketVolume?: number;
}

function getValidatedInterval(
  param: string | null
): (typeof validIntervals)[number] {
  if (
    param &&
    validIntervals.includes(param as (typeof validIntervals)[number])
  ) {
    return param as (typeof validIntervals)[number];
  }
  console.warn(
    `Invalid or missing interval "${param}" provided. Defaulting to "1d".`
  );
  return "1d";
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const symbol = url.searchParams.get("symbol") || "AAPL";
  const period = url.searchParams.get("period") || "2025-01-01";

  const intervalParam = url.searchParams.get("interval");
  const interval = getValidatedInterval(intervalParam);

  try {
    const chartData = await yahooFinance.chart(symbol, {
      period1: period,
      interval: interval,
      includePrePost: false,
    });

    const stockData = await yahooFinance.quoteSummary(symbol, {
      modules: ["price", "assetProfile"],
    });

    // transform stockData

    const transformedStockData: TransformedStockData = {
      symbol: stockData.price?.symbol,
      longName: stockData.price?.longName ?? undefined,
      shortName: stockData.price?.shortName ?? undefined,
      sector: stockData.assetProfile?.sector,
      industry: stockData.assetProfile?.industry,
      website: stockData.assetProfile?.website,
      longBusinessSummary: stockData.assetProfile?.longBusinessSummary,
      marketCap: stockData.price?.marketCap,
      regularMarketPrice: stockData.price?.regularMarketPrice,
      regularMarketChange: stockData.price?.regularMarketChange,
      regularMarketChangePercent: stockData.price?.regularMarketChangePercent,
      regularMarketVolume: stockData.price?.regularMarketVolume,
    };

    // Add validation for empty data
    if (!chartData?.quotes?.length) {
      return NextResponse.json(
        { error: "No historical data found" },
        { status: 404 }
      );
    }

    const processedData = {
      candlestick: chartData.quotes
        .filter((q) => q.open && q.high && q.low && q.close)
        .map((q) => ({
          x: new Date(q.date).getTime(),
          y: [q.open, q.high, q.low, q.close],
        })),
      movingAverage: chartData.quotes
        .filter((q) => q.close)
        .map((q, index, arr) => {
          if (index < 6) return null;
          const closes = arr.slice(index - 6, index + 1).map((d) => d.close!);
          const sum = closes.reduce((a, b) => a + b, 0);
          return {
            x: new Date(q.date).getTime(),
            y: sum / 7,
          };
        })
        .filter(Boolean),
    };

    return NextResponse.json({
      transformedStockData,
      series: [
        {
          name: "Moving Average",
          type: "line",
          data: processedData.movingAverage,
        },
        {
          name: "Candlestick",
          type: "candlestick",
          data: processedData.candlestick,
        },
      ],
    });
  } catch (error) {
    console.error("Error fetching stock data:", error);
    return NextResponse.json(
      { error: "Error fetching stock data" },
      { status: 500 }
    );
  }
}
