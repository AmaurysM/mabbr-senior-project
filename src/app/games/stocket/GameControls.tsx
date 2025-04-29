import React from "react";
import { formatMultiplier, formatCurrency } from "../../util/formatters";
import { MIN_BET_AMOUNT, MAX_BET_AMOUNT } from "./constants";

interface GameControlsProps {
  userBalance: number | null;
  isLoadingBalance: boolean;
  gameActive: boolean;
  gameEnded: boolean;
  canStart: boolean;
  currentMultiplier: number;
  onStart: () => void;
  onSell: () => void;
  hasMounted: boolean;
  betAmount: number;
  onBetAmountChange: (value: string) => void;
  minBet: number;
  maxBet: number;
}

const GameControls: React.FC<GameControlsProps> = ({
  userBalance,
  isLoadingBalance,
  gameActive,
  gameEnded,
  canStart,
  currentMultiplier,
  onStart,
  onSell,
  hasMounted,
  betAmount,
  onBetAmountChange,
  minBet,
  maxBet,
}) => {
  const displayBalance = () => {
    if (!hasMounted || isLoadingBalance || userBalance === null) {
      return "Loading...";
    }
    return formatCurrency(userBalance);
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onBetAmountChange(event.target.value);
  };

  return (
    <div className="space-y-4">
      {/* Top Row: Balance and Bet Input */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch gap-4 text-white bg-gray-900 px-4 py-3 rounded-md border border-gray-700">
        {/* Balance Display */}
        <div className="flex-1">
          <label className="text-xs text-gray-400 block mb-1">Balance</label>
          <p className="text-lg font-semibold h-8 flex items-center"> {/* Added height for alignment */}
            {displayBalance()}
          </p>
        </div>

        {/* Bet Amount Input */}
        <div className="flex-1">
           <label htmlFor="betAmountInput" className="text-xs text-gray-400 block mb-1">Bet Amount ($)</label>
           <input
             id="betAmountInput"
             type="number"
             value={betAmount}
             onChange={handleInputChange}
             min={minBet}
             max={maxBet}
             step="0.01"
             disabled={gameActive || !hasMounted}
             className={`w-full h-8 px-3 py-1 bg-gray-700 border border-gray-600 rounded-md text-white font-semibold text-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition ${
               (gameActive || !hasMounted) ? 'opacity-60 cursor-not-allowed' : ''
             }`}
             onWheel={(e) => (e.target as HTMLInputElement).blur()}
           />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        {!gameActive && gameEnded ? (
          <button
            className={`flex-1 py-3 px-4 rounded-lg transition-colors font-semibold text-base md:text-lg text-center ${
              hasMounted && canStart
                ? "bg-purple-600 hover:bg-purple-700 text-white shadow-md"
                : "bg-gray-600 text-gray-400 cursor-not-allowed"
            }`}
            disabled={!hasMounted || !canStart || isLoadingBalance}
            onClick={onStart}
          >
            {/* *** Update button text to use betAmount state *** */}
            Start Game ({formatCurrency(betAmount)})
          </button>
        ) : (
          <button
            className={`flex-1 py-3 px-4 rounded-lg transition-colors font-semibold text-base md:text-lg text-center ${
              hasMounted && gameActive && !gameEnded
                ? "bg-green-600 hover:bg-green-700 text-white shadow-md animate-pulse"
                : "bg-gray-600 text-gray-400 cursor-not-allowed"
            }`}
            disabled={!hasMounted || !gameActive || gameEnded}
            onClick={onSell}
          >
            Sell Now ({formatMultiplier(currentMultiplier)})
          </button>
        )}
      </div>
    </div>
  );
};

export default GameControls;