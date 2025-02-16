import React from "react";
import { StockData } from "../constants/StockDataTest";

const StockTile: React.FC<{ stock: StockData }> = ({ stock }) => {
    return (
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-2xl p-4 w-64 transition-transform transform hover:scale-105 hover:shadow-xl">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {stock.symbol}
          </h2>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {stock.currency}
          </span>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-300">{stock.shortName}</p>
        <p className="mt-2 text-2xl font-semibold text-blue-600 dark:text-blue-400">
          ${stock.regularMarketPrice.toFixed(2)}
        </p>
      </div>
    );
  };
  
  export default StockTile;