"use client";
import React from 'react';
import PortfolioChart from './PortfolioChart/page';
import PortfolioTable from './PortfolioTable/page';
import Risk from './Risk/page';

const UserPortfolio: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-r from-gray-900 to-gray-800 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <header className="mb-12 text-center">
          <h1 className="text-5xl font-extrabold text-white mb-4">
            Welcome To Your Portfolio
          </h1>
          <p className="text-lg text-gray-300">
            Monitor your investments, assess risk, and track your holdings all in one place.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-8">
          {/* Portfolio Chart Section */}
          <section className="bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-3xl font-bold text-white mb-4">
              Portfolio Value Over Time
            </h2>
            <PortfolioChart />
          </section>

          {/* Risk Assessment Section */}
          <section className="bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-3xl font-bold text-white mb-4">
             Risk Assessment
            </h2>
            <Risk />
          </section>

          {/* Portfolio Holdings Section */}
          <section className="bg-gray-800 rounded-xl shadow-lg">
            <h2 className="text-3xl font-bold text-white mb-4">
              Your Current Holdings
            </h2>
            <PortfolioTable />
          </section>
        </div>
      </div>
    </div>
  );
};

export default UserPortfolio;
