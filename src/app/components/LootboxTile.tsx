import React from "react";
import { Lootbox, StockRarity } from "../constants/LootBoxDataTest";
//import { StockData, Lootbox, StockRarity } from "../types"; // Adjust the path based on your project structure

const rarityColors: Record<StockRarity, string> = {
  [StockRarity.Common]: "bg-gray-200 text-gray-700",
  [StockRarity.Uncommon]: "bg-green-200 text-green-700",
  [StockRarity.Rare]: "bg-blue-200 text-blue-700",
  [StockRarity.Epic]: "bg-purple-200 text-purple-700",
  [StockRarity.Legendary]: "bg-yellow-300 text-yellow-900 font-bold",
  [StockRarity.Mythic]: "bg-red-400 text-white font-bold",
};

const rarityGlows: Record<StockRarity, string> = {
    [StockRarity.Common]: "shadow-gray-500/50",
    [StockRarity.Uncommon]: "shadow-blue-500/50",
    [StockRarity.Rare]: "shadow-indigo-500/50",
    [StockRarity.Epic]: "shadow-purple-500/50",
    [StockRarity.Legendary]: "shadow-pink-500/50",
    [StockRarity.Mythic]: "shadow-red-500/50",
  };

const LootboxTile = ({ id, name, stocks, price, category, createdAt }: Lootbox) => {
    return (
      <div className={`
        relative bg-gradient-to-b from-gray-900 to-gray-800 
        rounded-lg p-4
        border-2 ${rarityColors[name].split(' ')[2]}
        shadow-lg ${rarityGlows[name]} hover:shadow-xl
        transition-all duration-300 hover:scale-105
        overflow-hidden
      `}>
        {/* Rarity Badge */}
        <div className={`
          absolute top-0 right-0 px-4 py-1 rounded-bl-lg
          ${rarityColors[name].split(' ').slice(0, 2).join(' ')}
          font-bold text-sm tracking-wider
        `}>
          {name}
        </div>
  
        {/* Category Name */}
        <h2 className="text-2xl font-bold text-white mt-6 mb-2">
          {category}
        </h2>
  
        {/* Price */}
        <div className="text-lg font-semibold text-green-400 mb-4">
          ${price ? price.toFixed(2) : 'N/A'}
        </div>
  
        {/* Stocks List */}
        <div className="space-y-2 mt-4">
          <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
            Contains:
          </h3>
          <div className="space-y-2">
            {stocks.map((stock) => (
              <div 
                key={stock.symbol}
                className="bg-gray-800/50 rounded p-2 border border-gray-700"
              >
                <div className="text-white font-medium">
                  {stock.symbol}
                </div>
                <div className="text-sm text-gray-400">
                  {stock.shortName}
                </div>
                <div className="text-green-400 text-sm">
                  ${stock.regularMarketPrice}
                </div>
              </div>
            ))}
          </div>
        </div>
  
        {/* Creation Date 
        <div className="text-xs text-gray-500 mt-4">
          Created: {createdAt}
        </div>*/}
      </div>
    );
  };

export default LootboxTile;
