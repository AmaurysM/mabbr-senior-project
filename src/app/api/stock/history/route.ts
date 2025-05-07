// D:\Projects\mabbr-senior-project\src\app\api\stock\history\route.ts
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import yahooFinance from "yahoo-finance2";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    console.log("0,00000000000000000000000000000000000000000000000000000")
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

    const targetDate = new Date(date);
    if (isNaN(targetDate.getTime())) {
      return NextResponse.json({ error: "Invalid date" }, { status: 400 });
    }

    const period1 = new Date(targetDate);
    period1.setDate(period1.getDate() - 1);

    const period2 = new Date(targetDate);
    period2.setDate(period2.getDate() + 1);

    const historicalData = await yahooFinance.historical(symbol, {
      period1,
      period2,
    });

    const matchingDay = historicalData.find((d) => {
      const dataDate = d.date.toISOString().split("T")[0];
      const targetKey = targetDate.toISOString().split("T")[0];
      return dataDate === targetKey;
    });

    if (!matchingDay) {
      return NextResponse.json(
        { error: `No data found for ${symbol} on ${date}` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      symbol,
      date,
      price: matchingDay.close,
    });
  } catch (error) {
    console.error("Error fetching stock price:", error);
    return NextResponse.json(
      { error: "Failed to fetch stock price" },
      { status: 500 }
    );
  }
}
