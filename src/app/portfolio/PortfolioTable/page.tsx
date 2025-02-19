import React from 'react';

interface Holding {
  symbol: string;
  quantity: number;
  avgPrice: number;
}

// Dummy holdings data
const holdings: Holding[] = [
  { symbol: 'AAPL', quantity: 10, avgPrice: 150 },
  { symbol: 'GOOGL', quantity: 5, avgPrice: 2800 },
  { symbol: 'TSLA', quantity: 3, avgPrice: 700 },
];

const PortfolioTable = () => {
  return (
    <div className="bg-gray-800 p-4 rounded-lg overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-700">
            <th className="text-left py-2 px-4 text-white">Symbol</th>
            <th className="text-left py-2 px-4 text-white">Quantity</th>
            <th className="text-left py-2 px-4 text-white">Avg. Price</th>
          </tr>
        </thead>
        <tbody>
          {holdings.map((holding, index) => (
            <tr key={index} className="border-b border-gray-700">
              <td className="py-2 px-4 text-gray-200">{holding.symbol}</td>
              <td className="py-2 px-4 text-gray-200">{holding.quantity}</td>
              <td className="py-2 px-4 text-gray-200">
                ${holding.avgPrice.toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PortfolioTable;
