import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { LootBox, LootboxWithStocks } from '@/lib/prisma_types';

// GET a specific lootbox
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    const lootbox: LootboxWithStocks | null = await prisma.lootBox.findUnique({
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

    return NextResponse.json(lootbox);
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
    const body: LootboxWithStocks = await request.json();
    const { name, price, lootBoxStocks } = body;

    const existingLootbox:LootBox | null = await prisma.lootBox.findUnique({
      where: { id }
    });

    if (!existingLootbox) {
      return NextResponse.json(
        { error: 'Lootbox not found' },
        { status: 404 }
      );
    }

    const result: LootboxWithStocks | null = await prisma.$transaction(async (tx) => {
      const updatedLootbox = await tx.lootBox.update({
        where: { id },
        data: {
          name,
          price
        }
      });

      if (lootBoxStocks !== undefined) {

        await tx.lootBoxStock.deleteMany({
          where: { lootBoxId: id }
        });

        if (lootBoxStocks.length > 0) {
          await tx.lootBoxStock.createMany({
            data: lootBoxStocks.map((lootBoxStock) => ({
              lootBoxId: lootBoxStock.lootBoxId,  
              stockId: lootBoxStock.stockId,     
              quantity: lootBoxStock.quantity    
            }))
          });
        }
      }

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

    return NextResponse.json(result);
  } catch (error) {
    console.error(`Error updating lootbox ${params.id}:`, error);
    return NextResponse.json(
      { error: 'Failed to update lootbox' },
      { status: 500 }
    );
  }
}

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
      await tx.lootBoxStock.deleteMany({
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