"use client";

import { FaPercentage } from 'react-icons/fa';

interface DailyInterestPanelProps {
  interestRate: number;
  tokenCount: number;
  tokenValue: number;
}

const DailyInterestPanel: React.FC<DailyInterestPanelProps> = ({
  interestRate,
  tokenCount,
  tokenValue
}) => {
  const dailyInterestAmount = tokenCount * interestRate;
  const dailyInterestValue = dailyInterestAmount * tokenValue;
  const weeklyInterestAmount = dailyInterestAmount * 7;
  const weeklyInterestValue = dailyInterestValue * 7;
  const monthlyInterestAmount = dailyInterestAmount * 30;
  const monthlyInterestValue = dailyInterestValue * 30;
  
  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg h-full">
      <div className="flex items-center mb-4">
        <FaPercentage className="text-blue-500 mr-3 h-6 w-6" />
        <h2 className="text-2xl font-bold text-white">Daily Interest</h2>
      </div>
      
      <div className="space-y-4">
        <div className="text-sm text-gray-400 mb-2">
          Earn daily interest by holding tokens in your account.
        </div>
        
        <div className="bg-gradient-to-r from-blue-900 to-blue-700 p-4 rounded-lg">
          <div className="text-3xl font-bold text-white mb-1">
            {(interestRate * 100).toFixed(1)}%
          </div>
          <div className="text-blue-200 text-sm">Current Daily Interest Rate</div>
        </div>
        
        <div className="grid grid-cols-1 gap-3">
          <div className="bg-gray-700 p-3 rounded-lg">
            <div className="text-gray-400 text-sm mb-1">Current Daily Earnings</div>
            <div className="flex justify-between">
              <div className="text-xl font-semibold text-white">
                {dailyInterestAmount.toFixed(1)} <span className="text-sm text-gray-400">tokens</span>
              </div>
              <div className="text-green-400">${dailyInterestValue.toFixed(2)}</div>
            </div>
          </div>
          
          <div className="bg-gray-700 p-3 rounded-lg">
            <div className="text-gray-400 text-sm mb-1">Current Weekly Earnings</div>
            <div className="flex justify-between">
              <div className="text-xl font-semibold text-white">
                {weeklyInterestAmount.toFixed(1)} <span className="text-sm text-gray-400">tokens</span>
              </div>
              <div className="text-green-400">${weeklyInterestValue.toFixed(2)}</div>
            </div>
          </div>
          
          <div className="bg-gray-700 p-3 rounded-lg">
            <div className="text-gray-400 text-sm mb-1">Current Monthly Earnings</div>
            <div className="flex justify-between">
              <div className="text-xl font-semibold text-white">
                {monthlyInterestAmount.toFixed(1)} <span className="text-sm text-gray-400">tokens</span>
              </div>
              <div className="text-green-400">${monthlyInterestValue.toFixed(2)}</div>
            </div>
          </div>
        </div>
        
        <div className="text-xs text-gray-400 mt-2">
          Interest is calculated daily and added to your balance automatically at 00:00 UTC.
        </div>
      </div>
    </div>
  );
};

export default DailyInterestPanel; 