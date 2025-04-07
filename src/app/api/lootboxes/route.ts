import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET all lootboxes
export async function GET() {
  try {
    const lootboxes = await prisma.lootBox.findMany({
      include: {
        lootBoxStocks: {
          include: {
            stock: true,
          },
        },
      },
    });

    // Transform data format for the client
    const transformedLootboxes = lootboxes.map((lootbox) => ({
      ...lootbox,
      stocks: lootbox.lootBoxStocks.map((relation) => relation.stock),
    }));

    return NextResponse.json(transformedLootboxes);
  } catch (error) {
    console.error("Error fetching lootboxes:", error);
    return NextResponse.json(
      { error: "Failed to fetch lootboxes" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id") || "";
    const body = await request.json();
    const { name, description, price, stocks = [] } = body;

    // Function to count duplicate stocks
    function countDuplicateStocks(stocks: string[]) {
      const stockCount: Record<string, number> = {};
      
      for (const stock of stocks) {
        stockCount[stock] = (stockCount[stock] || 0) + 1;
      }

      return Object.entries(stockCount).map(([stockId, quantity]) => ({
        stockId,
        quantity,
      }));
    }

    // Check if lootbox exists
    const existingLootbox = await prisma.lootBox.findUnique({
      where: { id },
    });

    if (!existingLootbox) {
      return NextResponse.json({ error: "Lootbox not found" }, { status: 404 });
    }

    // Update the lootbox
    await prisma.lootBox.update({
      where: { id },
      data: {
        name,
        price,
        description
      },
    });

    // Update stock relations
    await prisma.lootBoxStock.deleteMany({
      where: { lootBoxId: id },
    });

    // Count stock occurrences and update the database
    const stockData = countDuplicateStocks(stocks);

    if (stockData.length > 0) {
      await prisma.lootBoxStock.createMany({
        data: stockData.map(({ stockId, quantity }) => ({
          lootBoxId: id,
          stockId,
          quantity,
        })),
      });
    }

    // Fetch the updated lootbox with its relations
    const result = await prisma.lootBox.findUnique({
      where: { id },
      include: {
        lootBoxStocks: {
          include: {
            stock: true,
          },
        },
      },
    });

    // Transform the result for the client
    const transformedLootbox = {
      ...result,
      stocks: result?.lootBoxStocks.map((relation) => ({
        ...relation.stock,
        quantity: relation.quantity, // Include quantity in response
      })) || [],
    };

    return NextResponse.json(transformedLootbox);
  } catch (error) {
    console.error("Error updating lootbox:", error);
    return NextResponse.json(
      { error: "Failed to update lootbox" },
      { status: 500 }
    );
  }
}


// CREATE a new lootbox
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, price, stocks = [] } = body;

    // Validate required fields
    if (!name || price === undefined) {
      return NextResponse.json(
        { error: "Name and price are required" },
        { status: 400 }
      );
    }

    // Create transaction to ensure lootbox and stock relations are created together
    const result = await prisma.$transaction(async (tx) => {
      // Create the lootbox
      const newLootbox = await tx.lootBox.create({
        data: {
          name,
          price,
        },
      });

      // Create stock relations if stocks are provided
      if (stocks.length > 0) {
        await tx.lootBoxStock.createMany({
          data: stocks.map((stockId: string) => ({
            lootBoxId: newLootbox.id,
            stockId,
            quantity:1,
          })),
        });
      }

      // Fetch the created lootbox with its relations
      return tx.lootBox.findUnique({
        where: { id: newLootbox.id },
        include: {
          lootBoxStocks: {
            include: {
              stock: true,
            },
          },
        },
      });
    });

    // Transform the result for the client
    const transformedLootbox = {
      ...result,
      stocks: result?.lootBoxStocks.map((relation) => relation.stock) || [],
    };

    return NextResponse.json(transformedLootbox, { status: 201 });
  } catch (error) {
    console.error("Error creating lootbox:", error);
    return NextResponse.json(
      { error: "Failed to create lootbox" },
      { status: 500 }
    );
  }
}
