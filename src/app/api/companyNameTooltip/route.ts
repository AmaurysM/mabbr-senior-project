// /app/api/companyName/route.ts (or /pages/api/companyName.ts if using pages dir)

import { NextResponse } from 'next/server';
import { yahooFinance } from "@/lib/yahooFinance";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');

  if (!symbol) return NextResponse.json({ error: 'Missing symbol' }, { status: 400 });

  try {
    const quote = await yahooFinance.quote(symbol);
    return NextResponse.json({ name: quote.shortName || 'Corporation' });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ name: 'Corporation' });
  }
}
