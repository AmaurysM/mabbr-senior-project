import React, { useState } from 'react';

interface StockAboutProps {
  symbol: string;
  longBusinessSummary?: string;
  sector?: string;
  industry?: string;
}

const StockAbout: React.FC<StockAboutProps> = ({
  symbol,
  longBusinessSummary,
  sector,
  industry,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const maxLength = 300;
  const shouldTruncate = longBusinessSummary && longBusinessSummary.length > maxLength;
  const displayText = shouldTruncate && !isExpanded
    ? `${longBusinessSummary.slice(0, maxLength)}...`
    : longBusinessSummary;

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-5 shadow-lg border border-white/10 h-full">
      <h2 className="text-xl font-bold text-white mb-4">About {symbol}</h2>
      <div className="space-y-4">
        {sector && (
          <div>
            <h4 className="text-gray-400 text-sm">Sector</h4>
            <p className="text-white">{sector}</p>
          </div>
        )}
        {industry && (
          <div>
            <h4 className="text-gray-400 text-sm">Industry</h4>
            <p className="text-white">{industry}</p>
          </div>
        )}
        {longBusinessSummary && (
          <div>
            <h4 className="text-gray-400 text-sm">Business Summary</h4>
            <p className="text-white text-sm leading-relaxed">
              {displayText}
            </p>
            {shouldTruncate && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-blue-400 hover:text-blue-300 text-sm mt-2 transition-colors"
              >
                {isExpanded ? 'Read less' : 'Read more'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StockAbout; 