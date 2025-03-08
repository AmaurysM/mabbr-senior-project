import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET all lootboxes
export async function GET() {
  try {
    const lootboxes = await prisma.lootBox.findMany({
      include: {
        lootBoxStocks: {
          include: {
            stock: true
          }
        }
      }
    });

    // Transform data format for the client
    const transformedLootboxes = lootboxes.map(lootbox => ({
      ...lootbox,
      stocks: lootbox.lootBoxStocks.map(relation => relation.stock)
    }));

    return NextResponse.json(transformedLootboxes);
  } catch (error) {
    console.error('Error fetching lootboxes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lootboxes' },
      { status: 500 }
    );
  }
}

// CREATE a new lootbox
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, price, stocks = [] } = body;

    // Validate required fields
    if (!name || price === undefined) {
      return NextResponse.json(
        { error: 'Name and price are required' },
        { status: 400 }
      );
    }

    // Create transaction to ensure lootbox and stock relations are created together
    const result = await prisma.$transaction(async (tx) => {
      // Create the lootbox
      const newLootbox = await tx.lootBox.create({
        data: {
          name,
          description,
          price,
        }
      });

      // Create stock relations if stocks are provided
      if (stocks.length > 0) {
        await tx.lootBoxStocks.createMany({
          data: stocks.map((stockId: string) => ({
            lootBoxId: newLootbox.id,
            stockId
          }))
        });
      }

      // Fetch the created lootbox with its relations
      return tx.lootBox.findUnique({
        where: { id: newLootbox.id },
        include: {
          lootBoxStocks: {
            include: {
              stock: true
            }
          }
        }
      });
    });

    // Transform the result for the client
    const transformedLootbox = {
      ...result,
      stocks: result?.lootBoxStocks.map(relation => relation.stock) || []
    };

    return NextResponse.json(transformedLootbox, { status: 201 });
  } catch (error) {
    console.error('Error creating lootbox:', error);
    return NextResponse.json(
      { error: 'Failed to create lootbox' },
      { status: 500 }
    );
  }
} 