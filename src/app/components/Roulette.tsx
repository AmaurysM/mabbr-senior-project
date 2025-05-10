// src/app/components/Roulette.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { authClient }       from "@/lib/auth-client";
import { abbreviateNumber } from "@/lib/utils";

const RED_SET = new Set([
  1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36
]);

export default function Roulette() {
  const { data: session } = authClient.useSession();
  const [balance, setBalance]     = useState(0);
  const [message, setMessage]     = useState("");
  const [betAmount, setBetAmount] = useState(5);
  const [result, setResult]       = useState<number | null>(null);
  const [ballPos, setBallPos]     = useState<{ x: number; y: number } | null>(null);

  const boardRef = useRef<HTMLDivElement>(null);
  const cellRefs = useRef<Array<HTMLButtonElement | null>>([]);

  // Load user balance
  useEffect(() => {
    if (!session?.user?.id) return;
    fetch("/api/user/portfolio", { credentials: "include" })
      .then(res => res.json())
      .then(data => {
        if (typeof data.balance === "number") {
          setBalance(data.balance);
        }
      })
      .catch(console.error);
  }, [session?.user?.id]);

  // Place a bet and handle spin
  const placeBet = async (bet: {
    type: "straight" | "color";
    number?: number;
    color?: "red" | "black";
    amount: number;
  }) => {
    if (!session?.user?.id) {
      alert("Please sign in to play.");
      return;
    }
    if (bet.amount < 1 || bet.amount > balance) {
      alert(`Bet must be between $1 and $${abbreviateNumber(balance)}`);
      return;
    }

    const res  = await fetch("/api/games/roulette", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bet),
    });
    const json = await res.json();
    if (!res.ok) {
      alert(json.error);
      return;
    }

    // Update state from response
    setBalance(json.balance);
    setResult(json.result);
    setMessage(
      json.profit >= 0
        ? `🎉 You hit ${json.result}! +$${abbreviateNumber(json.profit)}`
        : `💔 ${json.result}. -$${abbreviateNumber(-json.profit)}`
    );

    // Animate ball to winning slot
    const cell  = cellRefs.current[json.result];
    const board = boardRef.current;
    if (cell && board) {
      const bRect = board.getBoundingClientRect();
      const cRect = cell.getBoundingClientRect();
      setBallPos({
        x: cRect.left - bRect.left + cRect.width / 2 - 8,
        y: cRect.top  - bRect.top  + cRect.height / 2 - 8,
      });
    }
  };

  return (
    <div className="max-w-lg mx-auto mt-8 p-6 bg-gray-900 rounded-2xl shadow-lg text-gray-100">
      <h1 className="text-3xl font-bold mb-2 text-center">Roulette</h1>
      <p className="text-center mb-4">
        Balance: <span className="font-mono">${abbreviateNumber(balance)}</span>
      </p>

      {/* Bet amount input */}
      <div className="flex justify-center items-center mb-6 gap-2">
        <input
          type="number"
          min={1}
          max={Math.floor(balance)}
          value={betAmount}
          onChange={e => setBetAmount(Number(e.target.value))}
          className="w-24 p-2 bg-gray-800 rounded-lg text-center"
        />
        <span>per spin</span>
      </div>

      {/* Color bets */}
      <div className="flex justify-center gap-4 mb-6">
        <button
          onClick={() => placeBet({ type: "color", color: "red", amount: betAmount })}
          className="px-4 py-2 bg-red-600 rounded-lg hover:bg-red-500 transition"
        >
          Bet ${betAmount} Red
        </button>
        <button
          onClick={() => placeBet({ type: "color", color: "black", amount: betAmount })}
          className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition"
        >
          Bet ${betAmount} Black
        </button>
      </div>

      {/* Number grid with ball */}
      <div ref={boardRef} className="relative grid grid-cols-6 gap-2 mb-6">
        {ballPos && (
          <div
            className="absolute w-4 h-4 bg-white rounded-full shadow transition-all duration-1000 ease-out"
            style={{ left: ballPos.x, top: ballPos.y }}
          />
        )}
        {Array.from({ length: 37 }, (_, i) => (
          <button
            key={i}
            ref={el => { cellRefs.current[i] = el; }}     // callback ref returns void
            onClick={() => placeBet({ type: "straight", number: i, amount: betAmount })}
            className={`
              aspect-square flex items-center justify-center 
              rounded-md font-mono font-medium transition 
              ${RED_SET.has(i) ? "bg-red-700 hover:bg-red-600" : "bg-gray-800 hover:bg-gray-700"}
            `}
          >
            {i}
          </button>
        ))}
      </div>

      {/* Result message */}
      {message && (
        <div className="p-4 bg-gray-800 rounded-lg text-center text-lg">
          {message}
        </div>
      )}
    </div>
  );
}
