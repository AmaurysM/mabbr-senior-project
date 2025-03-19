import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET a specific stock
export async function GET(
  request: NextRequest,
) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id') || '';

    const stock = await prisma.stock.findUnique({
      where: { id }
    });

    if (!stock) {
      return NextResponse.json(
        { error: 'Stock not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(stock);
  } catch (error) {
    console.error(`Error fetching stock: `, error);
    return NextResponse.json(
      { error: 'Failed to fetch stock' },
      { status: 500 }
    );
  }
}

// UPDATE a stock
export async function PUT(
  request: NextRequest,
) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id') || '';
    const body = await request.json();
    const { name, ticker, price } = body;

    // Check if stock exists
    const existingStock = await prisma.stock.findUnique({
      where: { id }
    });

    if (!existingStock) {
      return NextResponse.json(
        { error: 'Stock not found' },
        { status: 404 }
      );
    }

    // If ticker is being changed, check for duplicates
    if (ticker && ticker !== existingStock.name) {
      const duplicateTicker = await prisma.stock.findFirst({
        where: { 
          name,
          id: { not: id }
        }
      });

      if (duplicateTicker) {
        return NextResponse.json(
          { error: 'Stock with this ticker already exists' },
          { status: 409 }
        );
      }
    }

    // Update the stock
    const updatedStock = await prisma.stock.update({
      where: { id },
      data: {
        name,
        price
      }
    });

    return NextResponse.json(updatedStock);
  } catch (error) {
    console.error(`Error updating stock: `, error);
    return NextResponse.json(
      { error: 'Failed to update stock' },
      { status: 500 }
    );
  }
}

// DELETE a stock
export async function DELETE(
  request: NextRequest,
) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id') || '';

    // Check if stock exists
    const existingStock = await prisma.stock.findUnique({
      where: { id }
    });

    if (!existingStock) {
      return NextResponse.json(
        { error: 'Stock not found' },
        { status: 404 }
      );
    }

    // Check if stock is used in any lootboxes
    const stockInUse = await prisma.lootBoxStock.findFirst({
      where: { stockId: id }
    });

    if (stockInUse) {
      return NextResponse.json(
        { error: 'Cannot delete a stock that is used in lootboxes' },
        { status: 409 }
      );
    }

    // Delete the stock
    await prisma.stock.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`Error deleting stock: `, error);
    return NextResponse.json(
      { error: 'Failed to delete stock' },
      { status: 500 }
    );
  }
} 