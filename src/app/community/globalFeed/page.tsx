"use client";

import React from 'react';
import { Toaster } from "@/app/components/ui/sonner"
import Leaderboard from '@/app/components/Leaderboard';
import MarketSentimentTable from '@/app/components/MarketSentimentTable';
import GlobalMarketChat from '@/app/components/GlobalMarketChat';


const GlobalFeed = () => {

  return (
    <div className="flex flex-col min-h-full">
      <div className="flex flex-col lg:flex-row gap-6 flex-1">
        <div className="w-full lg:w-3/4 h-[calc(100vh-10rem)]">
          <GlobalMarketChat />
        </div>

        <div className="w-full lg:w-1/4 flex flex-col gap-6">
          <Leaderboard num={5} />
          <MarketSentimentTable />
        </div>
      </div>

      <Toaster />
    </div>

  )
}

export default GlobalFeed