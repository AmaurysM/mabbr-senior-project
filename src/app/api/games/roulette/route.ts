// src/app/api/games/roulette/route.ts

import { NextResponse }        from "next/server";
import { headers }             from "next/headers";
import prisma                  from "@/lib/prisma";
import { auth }                from "@/lib/auth";

const RED = new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);

export async function POST(req: Request) {
  // 1️⃣ Authenticate via BetterAuth
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  const userId = session.user.id;

  // 2️⃣ Parse the incoming bet
  const { type, number, color, amount } = (await req.json()) as {
    type: "straight" | "color";
    number?: number;
    color?: "red" | "black";
    amount: number;
  };

  // 3️⃣ Load user and check balance
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.balance < amount) {
    return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
  }

  // 4️⃣ Spin the wheel
  const result = Math.floor(Math.random() * 37);
  let win = false;
  let multiplier = 0;

  if (type === "straight" && number === result) {
    win = true;
    multiplier = 36;  // 35:1 plus return of bet
  } else if (type === "color" && result !== 0) {
    const isRed = RED.has(result);
    if ((color === "red" && isRed) || (color === "black" && !isRed)) {
      win = true;
      multiplier = 2; // 1:1 plus return of bet
    }
  }

  // 5️⃣ Calculate profit and new balance
  const profit     = (multiplier - 1) * amount;
  const newBalance = user.balance + profit;

  // 6️⃣ Record game history and update balance in a transaction
  await prisma.$transaction([
    prisma.gameHistory.create({
      data: {
        userId,
        gameType:  "ROULETTE",
        outcome:   win ? "WIN" : "LOSE",
        multiplier,
        profit,
        betAmount: amount,
      },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { balance: newBalance },
    }),
  ]);

  // 7️⃣ Return the result
  return NextResponse.json({
    result,
    profit,
    balance: newBalance,
  });
}
