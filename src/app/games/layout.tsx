"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Toaster } from "@/app/components/ui/sonner";
import { FaAngleLeft, FaAngleRight, FaGamepad, FaGift, FaTicketAlt, FaChartBar, FaCoins, FaRocket, FaChartLine, FaClock, FaHourglassHalf, FaBomb } from "react-icons/fa";
import TokenLeaderboard from "../components/TokenLeaderboard";
import UserTokenDisplay from "../components/UserTokenDisplay";
import { useRouter, usePathname } from "next/navigation";

enum Tab {
  dailyDraw = "daily-draw",
  lootboxes = "lootboxes",
  scratchOffs = "scratch-offs",
  stocket = "stocket",
  stockPredictor = "stock-predictor",
  cryptoMinesweeper = "crypto-minesweeper",
  tokenMarket = "token-market"
}

const getDailyDrawTimeRemaining = () => {
  const now = new Date();
  const drawTime = new Date(now);
  drawTime.setHours(21, 30, 0, 0); // 9:30 PM
  
  // If current time is past today's draw time, set for tomorrow
  if (now > drawTime) {
    drawTime.setDate(drawTime.getDate() + 1);
  }
  
  const diffMs = drawTime.getTime() - now.getTime();
  const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const diffSecs = Math.floor((diffMs % (1000 * 60)) / 1000);
  
  // Adaptive display based on time remaining
  if (diffHrs > 0) {
    return `${diffHrs}h`;
  } else if (diffMins > 0) {
    return `${diffMins}m`;
  } else {
    return `${diffSecs}s`;
  }
};

export default function GamesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>(getDailyDrawTimeRemaining());
  const router = useRouter();
  const pathname = usePathname();

  // Determine active tab from the pathname
  const getActiveTabFromPathname = () => {
    if (pathname.includes('daily-draw')) return Tab.dailyDraw;
    if (pathname.includes('lootboxes')) return Tab.lootboxes;
    if (pathname.includes('scratch-offs')) return Tab.scratchOffs;
    if (pathname.includes('stocket')) return Tab.stocket;
    if (pathname.includes('stock-predictor')) return Tab.stockPredictor;
    if (pathname.includes('crypto-minesweeper')) return Tab.cryptoMinesweeper;
    if (pathname.includes('token-market')) return Tab.tokenMarket;
    return Tab.tokenMarket; // default
  };

  const [activeTab, setActiveTab] = useState<Tab>(getActiveTabFromPathname());

  // Update active tab when pathname changes
  useEffect(() => {
    setActiveTab(getActiveTabFromPathname());
  }, [pathname]);

  useEffect(() => {
    // Update timer based on remaining time
    const updateTimer = () => {
      const newTimeValue = getDailyDrawTimeRemaining();
      setTimeRemaining(newTimeValue);
    };
    
    // Initial update
    updateTimer();
    
    // Set interval to update every second
    const timer = setInterval(updateTimer, 1000);
    
    return () => clearInterval(timer);
  }, []);

  const toggleSidebar = useCallback((e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering handleClickOutside
    setIsSidebarOpen(prev => !prev);
  }, []);

  const handleClickOutside = useCallback((event: MouseEvent) => {
    // Close sidebar if click is outside both sidebar and menu button
    if (
      sidebarRef.current &&
      !sidebarRef.current.contains(event.target as Node) &&
      menuButtonRef.current &&
      !menuButtonRef.current.contains(event.target as Node)
    ) {
      setIsSidebarOpen(false);
    }
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setIsSidebarOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (isSidebarOpen) {
      document.addEventListener('click', handleClickOutside);
    } else {
      document.removeEventListener('click', handleClickOutside);
    }
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isSidebarOpen, handleClickOutside]);

  const handleTabClick = (tab: Tab) => {
    // Store selected tab in localStorage
    localStorage.setItem("activeGamesComponent", tab);
    // Navigate to the selected tab
    router.push(`/games/${tab}`);
    setIsSidebarOpen(false);
  };

  const getDisplayName = (tab: Tab) => {
    switch (tab) {
      case Tab.dailyDraw:
        return "Daily Draw";
      case Tab.lootboxes:
        return "Lootboxes";
      case Tab.scratchOffs:
        return "Scratch Offs";
      case Tab.stocket:
        return "Stocket";
      case Tab.stockPredictor:
        return "Stock Predictor";
      case Tab.cryptoMinesweeper:
        return "Stock Sweeper";
      case Tab.tokenMarket:
        return "Token Market";
      default:
        return tab;
    }
  };

  const getTabIcon = (tab: Tab) => {
    switch (tab) {
      case Tab.dailyDraw:
        return <FaHourglassHalf className="w-5 h-5" />;
      case Tab.lootboxes:
        return <FaGift className="w-5 h-5" />;
      case Tab.scratchOffs:
        return <FaTicketAlt className="w-5 h-5" />;
      case Tab.stocket:
        return <FaRocket className="w-5 h-5" />;
      case Tab.stockPredictor:
        return <FaChartLine className="w-5 h-5" />;
      case Tab.cryptoMinesweeper:
        return <FaBomb className="w-5 h-5" />;
      case Tab.tokenMarket:
        return <FaCoins className="w-5 h-5" />;
      default:
        return <FaRocket className="w-5 h-5" />;
    }
  };

  // Order sidebar tabs, featuring Token Market first and removing Daily Draw
  const sidebarTabs: Tab[] = [
    Tab.tokenMarket,
    Tab.lootboxes,
    Tab.scratchOffs,
    Tab.stocket,
    Tab.stockPredictor,
    Tab.cryptoMinesweeper,
  ];

  return (
    <div className="flex h-full">
      {/* Left Sidebar (Fixed) */}
      <div ref={sidebarRef}
        className={`fixed lg:relative inset-y-0 left-0 w-64 lg:w-60 min-w-60 overflow-y-auto bg-gray-800 p-4 border-r border-gray-700 z-50 transform transition-transform duration-300 lg:translate-x-0 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}>
        
        {/* User Token Display at the top of sidebar */}
        <div className='mb-4'>
          <UserTokenDisplay />
        </div>
        
        <div className='sticky top-0 space-y-8'>
          <nav className='space-y-2'>
            {sidebarTabs.map((value) => (
              <button
                key={value}
                onClick={() => handleTabClick(value)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                  activeTab === value
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700/50'
                }`}
              >
                {getTabIcon(value)}
                <span className='flex-grow text-center'>{getDisplayName(value)}</span>
              </button>
            ))}
          </nav>
          <TokenLeaderboard />
        </div>
      </div>

      <button
        ref={menuButtonRef}
        onClick={toggleSidebar}
        className={`lg:hidden fixed top-30 left-0 z-50 shadow-md transition-all duration-300 ${isSidebarOpen
            ? "bg-white text-gray-800 translate-x-64"
            : "bg-blue-600 text-white"
          } py-3 pl-2 pr-3 rounded-r-lg flex items-center justify-center`}
        aria-label={isSidebarOpen ? "Close games menu" : "Open games menu"}
        aria-expanded={isSidebarOpen}
      >
        {isSidebarOpen ? (
          <FaAngleLeft className="w-5 h-5" />
        ) : (
          <FaAngleRight className="w-5 h-5" />
        )}
      </button>

      {/* Content Area */}
      <div ref={scrollRef} className="flex-grow h-full overflow-y-auto p-4 pb-8">
        {children}
      </div>

      <Toaster />
    </div>
  );
} 