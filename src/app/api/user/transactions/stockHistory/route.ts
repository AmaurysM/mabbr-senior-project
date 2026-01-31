import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { UserTransactions } from "@/lib/prisma_types";
import { yahooFinance } from "@/lib/yahooFinance";

export async function GET(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const userId = url.searchParams.get("userId");
    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const transactions: UserTransactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { timestamp: "asc" },
    });

    if (transactions.length === 0) {
      return NextResponse.json([], { status: 200 });
    }

    const stockTransactions = transactions.filter(
      (tx) => tx.stockSymbol && ["BUY", "SELL"].includes(tx.type.toUpperCase())
    );

    if (stockTransactions.length === 0) {
      return NextResponse.json([], { status: 200 });
    }

    const uniqueSymbols = [...new Set(stockTransactions.map(tx => tx.stockSymbol))];

    const startDate = new Date(stockTransactions[0].timestamp);
    const endDate = new Date();

    const symbolPriceData: Record<string, Record<string, number>> = {};
    const todaysPriceData: Record<string, number> = {}; 
    for (const symbol of uniqueSymbols) {
      try {
        const historicalData = await yahooFinance.historical(symbol, {
          period1: startDate,
          period2: endDate,
        });

        symbolPriceData[symbol] = {};
        for (const dataPoint of historicalData) {
          const dateKey = dataPoint.date.toISOString().split('T')[0];
          symbolPriceData[symbol][dateKey] = dataPoint.close;
        }

        const quote = await yahooFinance.quote(symbol);
        todaysPriceData[symbol] = quote.regularMarketDayHigh ?? 0; 
      } catch (error) {
        console.error(`Error fetching data for ${symbol}:`, error);
      }
    }

    const dailyPortfolio: Record<string, Record<string, number>> = {};
    const currentHoldings: Record<string, number> = {};

    for (const tx of stockTransactions) {
      const dateKey = tx.timestamp.toISOString().split('T')[0];
      const symbol = tx.stockSymbol!;
      const shares = tx.quantity;
      const isBuy = tx.type.toUpperCase() === "BUY";

      currentHoldings[symbol] = (currentHoldings[symbol] || 0) + (isBuy ? shares : -shares);

      if (currentHoldings[symbol] === 0) {
        delete currentHoldings[symbol];
      }

      dailyPortfolio[dateKey] = { ...currentHoldings };
    }

    const portfolioValueOverTime: [string, number][] = [];

    const allTradingDays = new Set<string>();
    Object.values(symbolPriceData).forEach(priceMap => {
      Object.keys(priceMap).forEach(date => allTradingDays.add(date));
    });

    const sortedTradingDays = Array.from(allTradingDays).sort();

    let lastHoldings: Record<string, number> = {};

    for (const day of sortedTradingDays) {
      const dayDate = new Date(day);

      const relevantDates = Object.keys(dailyPortfolio)
        .filter(date => new Date(date) <= dayDate)
        .sort();

      if (relevantDates.length > 0) {
        const mostRecentDate = relevantDates[relevantDates.length - 1];
        lastHoldings = dailyPortfolio[mostRecentDate];

        let totalValue = 0;

        for (const [symbol, shares] of Object.entries(lastHoldings)) {
          const price = symbolPriceData[symbol]?.[day];

          if (price !== undefined) {
            totalValue += shares * price;
          }
        }

        if (totalValue > 0) {
          portfolioValueOverTime.push([day, parseFloat(totalValue.toFixed(2))]);
        }
      }
    }

    const today = new Date().toISOString().split('T')[0];
    const todaysPortfolioValue = Object.entries(currentHoldings).reduce((totalValue, [symbol, shares]) => {
      const price = todaysPriceData[symbol];
      if (price !== undefined) {
        totalValue += shares * price;
      }
      return totalValue;
    }, 0);

    if (todaysPortfolioValue > 0) {
      portfolioValueOverTime.push([today, parseFloat(todaysPortfolioValue.toFixed(2))]);
    }

    return NextResponse.json(portfolioValueOverTime);
  } catch (error) {
    console.error("Error computing portfolio value:", error);
    return NextResponse.json(
      { error: "Failed to compute portfolio value" },
      { status: 500 }
    );
  }
}
