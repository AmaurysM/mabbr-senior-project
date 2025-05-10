// src/app/components/Roulette.tsx
"use client";

import React, { useState, useEffect } from "react";
import { authClient }        from "@/lib/auth-client";
import { abbreviateNumber }  from "@/lib/utils";
import RouletteWheel         from "./RouletteWheel";

const WHEEL_ORDER = [
  0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,
  23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,
  35,3,26
];
const RED_SET = new Set([
  1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36
]);

export default function Roulette() {
  const { data: session }     = authClient.useSession();
  const [balance, setBalance] = useState(0);
  const [betAmount, setBetAmount] = useState(5);
  const [message, setMessage]     = useState("");
  const [rotation, setRotation]   = useState(0);
  const [spinning, setSpinning]   = useState(false);

  // Load initial balance
  useEffect(() => {
    if (!session?.user?.id) return;
    fetch("/api/user/portfolio", { credentials: "include" })
      .then(r => r.json())
      .then(d => typeof d.balance === "number" && setBalance(d.balance))
      .catch(console.error);
  }, [session?.user?.id]);

  const handleSpin = async (bet: {
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

    setSpinning(true);
    // Deduct stake immediately
    setBalance(b => b - bet.amount);

    const res  = await fetch("/api/games/roulette", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bet),
    });
    const json = await res.json();
    if (!res.ok) {
      alert(json.error);
      setSpinning(false);
      return;
    }

    // Compute spin rotation to land on json.result
    const idx = WHEEL_ORDER.indexOf(json.result);
    const fullSpins = 5;
    const delta = fullSpins * 360 + (360 - idx * (360 / WHEEL_ORDER.length));
    setRotation(r => r + delta);

    // When wheel stops, payout
    const onStop = () => {
      setSpinning(false);
      setBalance(json.balance);
      setMessage(
        json.profit >= 0
          ? `🎉 You hit ${json.result}! +$${abbreviateNumber(json.profit)}`
          : `💔 ${json.result}. -$${abbreviateNumber(-json.profit)}`
      );
    };

    // Pass onStop handler into the wheel component via prop
    setOnWheelStop(() => onStop);
  };

  // Because onStop is dynamic, wrap in state to pass stable reference
  const [onWheelStop, setOnWheelStop] = useState<() => void>(() => () => {});

  return (
    <div className="max-w-5xl mx-auto p-6 bg-gray-900 text-gray-100 rounded-2xl shadow-lg">
      <h1 className="text-3xl font-bold text-center mb-6">Roulette</h1>
      <p className="text-center mb-8">
        Balance: <span className="font-mono">${abbreviateNumber(balance)}</span>
      </p>

      <div className="grid lg:grid-cols-2 gap-12">
        {/* Left: Table Grid */}
        <div>
          <div className="flex justify-center items-center mb-4 gap-2">
            <input
              type="number"
              min={1}
              max={Math.floor(balance)}
              value={betAmount}
              onChange={e => setBetAmount(Number(e.target.value))}
              className="w-20 p-2 bg-gray-800 rounded text-center"
            />
            <span className="text-gray-400">per spin</span>
          </div>

          <div className="flex justify-center gap-4 mb-6">
            <button
              disabled={spinning}
              onClick={() => handleSpin({ type: "color", color: "red", amount: betAmount })}
              className="px-4 py-2 bg-red-600 rounded hover:bg-red-500 disabled:opacity-50"
            >
              Bet ${betAmount} Red
            </button>
            <button
              disabled={spinning}
              onClick={() => handleSpin({ type: "color", color: "black", amount: betAmount })}
              className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600 disabled:opacity-50"
            >
              Bet ${betAmount} Black
            </button>
          </div>

          <div className="grid grid-cols-6 gap-2">
            {WHEEL_ORDER.map((num) => (
              <button
                key={num}
                disabled={spinning}
                onClick={() => handleSpin({ type: "straight", number: num, amount: betAmount })}
                className={
                  `aspect-square flex items-center justify-center rounded-md font-mono transition ` +
                  (RED_SET.has(num)
                    ? "bg-red-700 hover:bg-red-600"
                    : "bg-gray-800 hover:bg-gray-700") +
                  " disabled:opacity-50"
                }
              >
                {num}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Spinning Wheel */}
        <div className="flex justify-center">
          <RouletteWheel
            order={WHEEL_ORDER}
            redSet={RED_SET}
            rotation={rotation}
            spinning={spinning}
            onStop={onWheelStop}
          />
        </div>
      </div>

      {message && (
        <div className="mt-8 p-4 bg-gray-800 rounded text-center text-lg">
          {message}
        </div>
      )}
    </div>
  );
}
