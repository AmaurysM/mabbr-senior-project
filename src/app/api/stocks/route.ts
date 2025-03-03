import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET all stocks
export async function GET() {
  try {
    const stocks = await prisma.stock.findMany();
    return NextResponse.json(stocks);
  } catch (error) {
    console.error('Error fetching stocks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stocks' },
      { status: 500 }
    );
  }
}

// CREATE a new stock
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, ticker, price } = body;

    // Validate required fields
    if (!name || !ticker || price === undefined) {
      return NextResponse.json(
        { error: 'Name, ticker, and price are required' },
        { status: 400 }
      );
    }

    // Check for duplicate ticker
    const existingStock = await prisma.stock.findFirst({
      where: { ticker }
    });

    if (existingStock) {
      return NextResponse.json(
        { error: 'Stock with this ticker already exists' },
        { status: 409 }
      );
    }

    // Create new stock
    const newStock = await prisma.stock.create({
      data: {
        name,
        ticker,
        price
      }
    });

    return NextResponse.json(newStock, { status: 201 });
  } catch (error) {
    console.error('Error creating stock:', error);
    return NextResponse.json(
      { error: 'Failed to create stock' },
      { status: 500 }
    );
  }
} 