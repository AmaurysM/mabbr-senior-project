import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET a specific lootbox
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    const lootbox = await prisma.lootBox.findUnique({
      where: { id },
      include: {
        lootBoxStocks: {
          include: {
            stock: true
          }
        }
      }
    });

    if (!lootbox) {
      return NextResponse.json(
        { error: 'Lootbox not found' },
        { status: 404 }
      );
    }

    // Transform data for client
    const transformedLootbox = {
      ...lootbox,
      stocks: lootbox.lootBoxStocks.map(relation => relation.stock)
    };

    return NextResponse.json(transformedLootbox);
  } catch (error) {
    console.error(`Error fetching lootbox ${params.id}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch lootbox' },
      { status: 500 }
    );
  }
}

// UPDATE a lootbox
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const body = await request.json();
    const { name, description, price, stocks } = body;

    // Check if lootbox exists
    const existingLootbox = await prisma.lootBox.findUnique({
      where: { id }
    });

    if (!existingLootbox) {
      return NextResponse.json(
        { error: 'Lootbox not found' },
        { status: 404 }
      );
    }

    // Update in a transaction to handle both lootbox and relations
    const result = await prisma.$transaction(async (tx) => {
      // Update lootbox basic info
      const updatedLootbox = await tx.lootBox.update({
        where: { id },
        data: {
          name,
          description,
          price
        }
      });

      // If stocks are provided, update relations
      if (stocks !== undefined) {
        // Delete existing relations
        await tx.lootBoxStocks.deleteMany({
          where: { lootBoxId: id }
        });

        // Create new relations
        if (stocks.length > 0) {
          await tx.lootBoxStocks.createMany({
            data: stocks.map((stockId: string) => ({
              lootBoxId: id,
              stockId
            }))
          });
        }
      }

      // Fetch the updated lootbox with relations
      return tx.lootBox.findUnique({
        where: { id },
        include: {
          lootBoxStocks: {
            include: {
              stock: true
            }
          }
        }
      });
    });

    // Transform for client
    const transformedLootbox = {
      ...result,
      stocks: result?.lootBoxStocks.map(relation => relation.stock) || []
    };

    return NextResponse.json(transformedLootbox);
  } catch (error) {
    console.error(`Error updating lootbox ${params.id}:`, error);
    return NextResponse.json(
      { error: 'Failed to update lootbox' },
      { status: 500 }
    );
  }
}

// DELETE a lootbox
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    // Check if lootbox exists
    const existingLootbox = await prisma.lootBox.findUnique({
      where: { id }
    });

    if (!existingLootbox) {
      return NextResponse.json(
        { error: 'Lootbox not found' },
        { status: 404 }
      );
    }

    // Delete in transaction to handle both lootbox and relations
    await prisma.$transaction(async (tx) => {
      // First delete relations
      await tx.lootBoxStocks.deleteMany({
        where: { lootBoxId: id }
      });

      // Then delete the lootbox
      await tx.lootBox.delete({
        where: { id }
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`Error deleting lootbox ${params.id}:`, error);
    return NextResponse.json(
      { error: 'Failed to delete lootbox' },
      { status: 500 }
    );
  }
} 