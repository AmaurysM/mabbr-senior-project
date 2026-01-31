// D:\Projects\mabbr-senior-project\src\app\api\stock\history\route.ts

import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
const yahooFinance = require('node-yahoo-finance2').default;
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    console.log("💡 /api/stock/history body:", body);
    const { symbol, date } = body;

    if (!symbol || !date) {
      return NextResponse.json(
        { error: "Missing symbol or date" },
        { status: 400 }
      );
    }

    const startDate = new Date(date);
    const endDate = new Date(); // Now

    if (isNaN(startDate.getTime())) {
      return NextResponse.json({ error: "Invalid start date" }, { status: 400 });
    }

    const historicalData = await yahooFinance.historical(symbol, {
      period1: startDate,
      period2: endDate,
    });

    if (!historicalData || historicalData.length === 0) {
      return NextResponse.json(
        { error: `No historical data found for ${symbol}` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      symbol,
      from: startDate.toISOString().split("T")[0],
      to: endDate.toISOString().split("T")[0],
      history: historicalData.map((d) => ({
        date: d.date,
        open: d.open,
        high: d.high,
        low: d.low,
        close: d.close,
        volume: d.volume,
        adjClose: d.adjClose,
      })),
    });
  } catch (error) {
    console.error("Error fetching stock history:", error);
    return NextResponse.json(
      { error: "Failed to fetch stock history" },
      { status: 500 }
    );
  }
}
