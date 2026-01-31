// app/api/stocks/live/route.ts
import { NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";

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

const validPeriods = [
  "1d",
  "5d",
  "1mo",
  "3mo",
  "6mo",
  "1y",
  "5y",
  "max",
] as const;

export interface TransformedStockData {
  symbol: string;
  regularMarketPrice: number;
  regularMarketChange: number;
  regularMarketChangePercent: number;
  regularMarketVolume: number;
  regularMarketOpen?: number;
  regularMarketDayHigh?: number;
  regularMarketDayLow?: number;
  regularMarketPreviousClose?: number;
  marketCap?: number;
  trailingPE?: number;
  dividendYield?: number;
  averageVolume?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  targetMeanPrice?: number;
  profitMargins?: number;
  operatingMargins?: number;
  returnOnAssets?: number;
  returnOnEquity?: number;
  enterpriseValue?: number;
  forwardPE?: number;
  earningsPerShare?: number;
  bookValue?: number;
  sector?: string;
  industry?: string;
  website?: string;
  longBusinessSummary?: string;
  shortName?: string;
  recommendationMean?: number;
  recommendationKey?: string;
  numberOfAnalystOpinions?: number;
}

function getValidatedInterval(
  param: string | null,
): (typeof validIntervals)[number] {
  if (
    param &&
    validIntervals.includes(param as (typeof validIntervals)[number])
  ) {
    return param as (typeof validIntervals)[number];
  }
  console.warn(
    `Invalid or missing interval "${param}" provided. Defaulting to "1d".`,
  );
  return "1d";
}

function getValidatedPeriod(
  param: string | null,
): (typeof validPeriods)[number] {
  if (param && validPeriods.includes(param as (typeof validPeriods)[number])) {
    return param as (typeof validPeriods)[number];
  }
  console.warn(
    `Invalid or missing period "${param}" provided. Defaulting to "1y".`,
  );
  return "1y";
}

/**
 * Convert period string (e.g. "1mo") to a proper date for Yahoo Finance API
 */
function getPeriodAsDate(period: string): string {
  const now = new Date();

  if (period === "1d") {
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    return yesterday.toISOString().split("T")[0];
  } else if (period === "5d") {
    const fiveDaysAgo = new Date(now);
    fiveDaysAgo.setDate(now.getDate() - 5);
    return fiveDaysAgo.toISOString().split("T")[0];
  } else if (period === "1mo") {
    const oneMonthAgo = new Date(now);
    oneMonthAgo.setMonth(now.getMonth() - 1);
    return oneMonthAgo.toISOString().split("T")[0];
  } else if (period === "3mo") {
    const threeMonthsAgo = new Date(now);
    threeMonthsAgo.setMonth(now.getMonth() - 3);
    return threeMonthsAgo.toISOString().split("T")[0];
  } else if (period === "6mo") {
    const sixMonthsAgo = new Date(now);
    sixMonthsAgo.setMonth(now.getMonth() - 6);
    return sixMonthsAgo.toISOString().split("T")[0];
  } else if (period === "1y") {
    const oneYearAgo = new Date(now);
    oneYearAgo.setFullYear(now.getFullYear() - 1);
    return oneYearAgo.toISOString().split("T")[0];
  } else if (period === "5y") {
    const fiveYearsAgo = new Date(now);
    fiveYearsAgo.setFullYear(now.getFullYear() - 5);
    return fiveYearsAgo.toISOString().split("T")[0];
  } else if (period === "max") {
    return "1900-01-01"; // Very old date to get all available data
  }

  // Default to 1 month ago
  const oneMonthAgo = new Date(now);
  oneMonthAgo.setMonth(now.getMonth() - 1);
  return oneMonthAgo.toISOString().split("T")[0];
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const symbol = url.searchParams.get("symbol") || "AAPL";

  const periodParam = url.searchParams.get("period");
  const validPeriod = getValidatedPeriod(periodParam);
  const period1 = getPeriodAsDate(validPeriod);

  const intervalParam = url.searchParams.get("interval");
  const interval = getValidatedInterval(intervalParam);

  try {
    console.log(
      `Fetching chart data for ${symbol} with period1=${period1} and interval=${interval}`,
    );
    const yf = new YahooFinance();

    const chartData = await yf.chart(symbol, {
      period1: period1,
      interval: interval,
      includePrePost: false,
    });
    //const stockData = await yf.quote(symbol);
    const stockData = await yf.quoteSummary(symbol, {
      modules: [
        "price",
        "summaryDetail",
        "financialData",
        "defaultKeyStatistics",
        "assetProfile",
      ],
    });
    // Transform stockData
    const transformedStockData: TransformedStockData = {
      symbol: stockData.price?.symbol || "N/A",
      regularMarketPrice: stockData.price?.regularMarketPrice || 0,
      regularMarketChange: stockData.price?.regularMarketChange || 0,
      regularMarketChangePercent:
        stockData.price?.regularMarketChangePercent || 0,
      regularMarketVolume: stockData.price?.regularMarketVolume || 0,
      regularMarketOpen: stockData.price?.regularMarketOpen,
      regularMarketDayHigh: stockData.price?.regularMarketDayHigh,
      regularMarketDayLow: stockData.price?.regularMarketDayLow,
      regularMarketPreviousClose: stockData.price?.regularMarketPreviousClose,

      marketCap: stockData.summaryDetail?.marketCap,
      trailingPE: stockData.summaryDetail?.trailingPE,
      dividendYield: stockData.summaryDetail?.dividendYield,
      averageVolume: stockData.summaryDetail?.averageVolume,
      fiftyTwoWeekHigh: stockData.summaryDetail?.fiftyTwoWeekHigh,
      fiftyTwoWeekLow: stockData.summaryDetail?.fiftyTwoWeekLow,

      targetMeanPrice: stockData.financialData?.targetMeanPrice,
      profitMargins: stockData.financialData?.profitMargins,
      operatingMargins: stockData.financialData?.operatingMargins,
      returnOnAssets: stockData.financialData?.returnOnAssets,
      returnOnEquity: stockData.financialData?.returnOnEquity,

      enterpriseValue: stockData.defaultKeyStatistics?.enterpriseValue,
      forwardPE: stockData.defaultKeyStatistics?.forwardPE,
      earningsPerShare: stockData.defaultKeyStatistics?.trailingEps,
      bookValue: stockData.defaultKeyStatistics?.bookValue,

      sector: stockData.assetProfile?.sector || "N/A",
      industry: stockData.assetProfile?.industry || "N/A",
      website: stockData.assetProfile?.website || "N/A",
      longBusinessSummary: stockData.assetProfile?.longBusinessSummary || "N/A",
      shortName: stockData.price?.shortName || "N/A",

      recommendationMean: stockData.financialData?.recommendationMean,
      recommendationKey: stockData.financialData?.recommendationKey || "N/A",
      numberOfAnalystOpinions: stockData.financialData?.numberOfAnalystOpinions,
    };

    // Add validation for empty data
    if (!chartData?.quotes?.length) {
      return NextResponse.json(
        { error: "No historical data found for the given period" },
        { status: 404 },
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

    console.log(transformedStockData, "-----------------------");

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

    // Provide more detailed error information
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      {
        error: "Error fetching stock data",
        details: errorMessage,
        symbol,
        period: periodParam,
        interval: intervalParam,
      },
      { status: 500 },
    );
  }
}
