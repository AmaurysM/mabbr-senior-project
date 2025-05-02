import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { UserTransactions } from "@/lib/prisma_types";

export async function GET(req: Request) {
  try {
    // 1. Authenticate
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const url = new URL(req.url);
    const userId = url.searchParams.get("userId");
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate"); 
    
    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }
    
    const dateFilter: any = {};
    if (startDate) {
      dateFilter.gte = new Date(startDate);
    }
    if (endDate) {
      dateFilter.lte = new Date(endDate);
    }
    
    const transactions: UserTransactions = await prisma.transaction.findMany({
      where: { 
        userId,
        ...(Object.keys(dateFilter).length > 0 ? { timestamp: dateFilter } : {})
      },
      orderBy: { timestamp: "asc" },
    });
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        balance: true,
        createdAt: true 
      },
    });
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    

    const signedAmounts = transactions.map(tx =>
      tx.type.toUpperCase() === "BUY"
        ? -tx.totalCost
        : tx.totalCost
    );
    
    const initialBalance = 100000; 
    
    const balanceOverTime: [string, number][] = [];
    
    balanceOverTime.push([
      user.createdAt.toISOString(),
      initialBalance
    ]);
    
    if (transactions.length === 0) {
      balanceOverTime.push([new Date().toISOString(), user.balance]);
    } else {
      let currentBalance = initialBalance;
      
      const dailyBalances = new Map<string, number>();
      
      const creationDate = user.createdAt.toISOString().split('T')[0];
      dailyBalances.set(creationDate, initialBalance);
      
      transactions.forEach((tx, i) => {
        currentBalance += signedAmounts[i];
        const txDate = tx.timestamp.toISOString();
        const dayKey = txDate.split('T')[0]; 
        
        dailyBalances.set(dayKey, currentBalance);
        
        balanceOverTime.push([txDate, currentBalance]);
      });
      
      if (transactions.length > 0) {
        const startDay = new Date(user.createdAt);
        const endDay = new Date(); // Today
        
        for (let day = new Date(startDay); day <= endDay; day.setDate(day.getDate() + 1)) {
          const dayKey = day.toISOString().split('T')[0];
          
          if (!dailyBalances.has(dayKey)) {
            const previousDays = [...dailyBalances.keys()]
              .filter(d => d < dayKey)
              .sort((a, b) => a.localeCompare(b));
            
            if (previousDays.length > 0) {
              const latestPreviousDay = previousDays[previousDays.length - 1];
              const prevBalance = dailyBalances.get(latestPreviousDay) || initialBalance;
              dailyBalances.set(dayKey, prevBalance);
            }
          }
        }
      }
      
      const today = new Date().toISOString().split('T')[0];
      if (!dailyBalances.has(today)) {
        dailyBalances.set(today, user.balance);
      } else {
        dailyBalances.set(today, user.balance);
      }
      
      balanceOverTime.push([new Date().toISOString(), user.balance]);
    }
    
    balanceOverTime.sort((a, b) => a[0].localeCompare(b[0]));
    
    return NextResponse.json(balanceOverTime);
    
  } catch (error) {
    console.error("Error computing balance over time:", error);
    return NextResponse.json(
      { error: "Failed to compute balance over time" },
      { status: 500 }
    );
  }
}

