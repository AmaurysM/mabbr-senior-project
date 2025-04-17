"use client";

import React from 'react';
import { Toaster } from "@/app/components/ui/sonner"
import Leaderboard from '@/app/components/Leaderboard';
import MarketSentimentTable from '@/app/components/MarketSentimentTable';
import GlobalMarketChat from '@/app/components/GlobalMarketChat';


const GlobalFeed = () => {

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
        {/* Left Column - Global Chat */}
        <div className="w-full">
          <GlobalMarketChat />
        </div>

        {/* Right Column - Leaderboards & Friends */}
        <div className="flex flex-col gap-6 w-full">
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