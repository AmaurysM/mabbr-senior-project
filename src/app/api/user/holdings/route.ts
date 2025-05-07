import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { UserStocks } from '@/lib/prisma_types';

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    //console.log("HoldingsHoldingsHoldingsHoldingsHoldingsHoldingsHoldings")

    const userId = session.user.id;

    const holdings: UserStocks = await prisma.userStock.findMany({
        where: {
           userId 
        },
        include: {
            stock: true
        }
    })

    holdings.forEach(e=>{
      console.log(e.stock.name + "Somethings --------------------" + e.stock.price)
    })

    

    return NextResponse.json(holdings ??[] ); 
  } catch (error) {
    console.error('Error getting friends transactions:', error);
    return NextResponse.json({ transactions: [] }, { status: 500 }); 
  }
}
