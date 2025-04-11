import React from 'react';

interface StockAnalystRatingProps {
  recommendationMean?: number;
  recommendationKey?: string;
  numberOfAnalystOpinions?: number;
}

const StockAnalystRating: React.FC<StockAnalystRatingProps> = ({
  recommendationMean,
  recommendationKey,
  numberOfAnalystOpinions,
}) => {
  // Get appropriate color based on recommendation value
  const getTextColor = () => {
    if (!recommendationMean) return '#fbbf24'; // Default to yellow (hold)
    
    if (recommendationMean <= 1.5) {
      return '#4ade80'; // Strong Buy - Green
    } else if (recommendationMean <= 2.5) {
      return '#4ade80'; // Buy - Green
    } else if (recommendationMean <= 3.5) {
      return '#fbbf24'; // Hold - Yellow
    } else if (recommendationMean <= 4.5) {
      return '#f87171'; // Sell - Red
    } else {
      return '#f87171'; // Strong Sell - Red
    }
  };

  // Format the recommendation key to replace underscores with spaces
  const formatRecommendation = (key: string = 'HOLD') => {
    return key.replace(/_/g, ' ');
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/10">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xl font-bold text-white">Analyst Ratings</h3>
        {numberOfAnalystOpinions && (
          <span className="text-white">{numberOfAnalystOpinions} analysts</span>
        )}
      </div>
      
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-400">Recommendation</span>
        <span className="font-medium" style={{ color: getTextColor() }}>
          {formatRecommendation(recommendationKey?.toUpperCase())}
        </span>
      </div>
      
      {recommendationMean ? (
        <>
          <div className="h-4 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full relative"
              style={{
                width: '100%',
                background: 'linear-gradient(to right, #f87171, #fbbf24, #4ade80)',
              }}
            >
              {/* White overlay to hide the unused portion of the gradient */}
              <div 
                className="absolute top-0 bottom-0 right-0 bg-gray-700"
                style={{
                  width: `${100 - ((5 - recommendationMean) / 4 * 100)}%`,
                }}
              />
            </div>
          </div>
          <div className="flex justify-between mt-1 text-xs">
            <span className="text-red-400 font-medium">Sell</span>
            <span className="text-yellow-400 font-medium">Hold</span>
            <span className="text-green-400 font-medium">Buy</span>
          </div>
        </>
      ) : (
        <div className="text-center py-2 text-gray-400">
          No analyst ratings available for this stock.
        </div>
      )}
    </div>
  );
};

export default StockAnalystRating; 