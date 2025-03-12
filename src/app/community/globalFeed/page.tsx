"use client";

import React from 'react';
import { Toaster } from "@/app/components/ui/sonner"
import Leaderboard from '@/app/components/Leaderboard';
import MarketSentimentTable from '@/app/components/MarketSentimentTable';
import DailyMarketVotePanel from '@/app/components/DailyMarketVotePanel';
import GlobalMarketChat from '@/app/components/GlobalMarketChat';


const GlobalFeed = () => {

  return (
    <div className="flex flex-col gap-6">
      {/* Daily Market Vote Panel */}
      <DailyMarketVotePanel />

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
        {/* Left Column - Global Chat */}
        <GlobalMarketChat />

        {/* Right Column - Leaderboards & Friends */}
        <div className="flex flex-col gap-6">
          {/* Top five leader board */}
          <Leaderboard num={5}/>

          {/* Market Sentiment */}
          <MarketSentimentTable/>
          
        </div>

      </div>
      <Toaster />

    </div>
  )
}

export default GlobalFeed