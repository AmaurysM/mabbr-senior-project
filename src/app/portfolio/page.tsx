"use client"
import React from 'react';
import PortfolioChart from './PortfolioChart/page';
import PortfolioTable from './PortfolioTable/page';

const userPortfolio = () => {
  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Portfolio</h1>
          <p className="text-gray-400">
            Review your portfolio performance and current holdings.
          </p>
        </div>

        {/* Portfolio Chart */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">
            Portfolio Value Over Time
          </h2>
          <PortfolioChart />
        </div>

        {/* Portfolio Holdings */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Current Holdings</h2>
          <PortfolioTable />
        </div>
      </div>
    </div>
  );
};

export default userPortfolio;
