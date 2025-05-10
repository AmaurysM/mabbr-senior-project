"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Toaster } from "@/app/components/ui/sonner";
import {
  FaAngleLeft,
  FaAngleRight,
  FaGamepad,
  FaGift,
  FaTicketAlt,
  FaCoins,
  FaRocket,
  FaChartLine,
  FaHourglassHalf,
  FaBomb
} from "react-icons/fa";
import TokenLeaderboard    from "../components/TokenLeaderboard";
import UserTokenDisplay    from "../components/UserTokenDisplay";
import { useRouter, usePathname } from "next/navigation";

enum Tab {
  dailyDraw         = "daily-draw",
  lootboxes         = "lootboxes",
  scratchOffs       = "scratch-offs",
  stocket           = "stocket",
  stockPredictor    = "stock-predictor",
  cryptoMinesweeper = "crypto-minesweeper",
  tokenMarket       = "token-market",
  roulette          = "roulette"
}

const getDailyDrawTimeRemaining = () => {
  const now = new Date();
  const drawTime = new Date(now);
  drawTime.setHours(21, 30, 0, 0);
  if (now > drawTime) drawTime.setDate(drawTime.getDate() + 1);
  const diff = drawTime.getTime() - now.getTime();
  const hrs  = Math.floor(diff / (1000*60*60));
  const mins = Math.floor((diff%(1000*60*60))/(1000*60));
  const secs = Math.floor((diff%(1000*60))/1000);
  return hrs>0 ? `${hrs}h` : mins>0 ? `${mins}m` : `${secs}s`;
};

export default function GamesLayout({ children }: { children: React.ReactNode }) {
  const scrollRef      = useRef<HTMLDivElement>(null);
  const sidebarRef     = useRef<HTMLDivElement>(null);
  const menuButtonRef  = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState(getDailyDrawTimeRemaining());
  const router         = useRouter();
  const pathname       = usePathname();

  const getActive = (): Tab => {
    if (pathname.includes("daily-draw"))       return Tab.dailyDraw;
    if (pathname.includes("lootboxes"))        return Tab.lootboxes;
    if (pathname.includes("scratch-offs"))     return Tab.scratchOffs;
    if (pathname.includes("stocket"))          return Tab.stocket;
    if (pathname.includes("stock-predictor"))  return Tab.stockPredictor;
    if (pathname.includes("crypto-minesweeper")) return Tab.cryptoMinesweeper;
    if (pathname.includes("token-market"))     return Tab.tokenMarket;
    if (pathname.includes("roulette"))         return Tab.roulette;
    return Tab.dailyDraw;
  };
  const [activeTab, setActiveTab] = useState<Tab>(getActive());

  useEffect(() => { setActiveTab(getActive()); }, [pathname]);
  useEffect(() => {
    const iv = setInterval(() => setTimeLeft(getDailyDrawTimeRemaining()), 1000);
    return () => clearInterval(iv);
  }, []);

  const toggleSidebar = useCallback((e: React.MouseEvent) => {
    e.stopPropagation(); setOpen(o => !o);
  }, []);
  const clickOutside = useCallback((ev: MouseEvent) => {
    if (
      sidebarRef.current &&
      !sidebarRef.current.contains(ev.target as Node) &&
      menuButtonRef.current &&
      !menuButtonRef.current.contains(ev.target as Node)
    ) setOpen(false);
  }, []);
  useEffect(() => {
    if (open) document.addEventListener("click", clickOutside);
    else      document.removeEventListener("click", clickOutside);
    return () => document.removeEventListener("click", clickOutside);
  }, [open, clickOutside]);
  useEffect(() => {
    const onResize = () => window.innerWidth >= 1024 && setOpen(false);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const goTab = (tab: Tab) => {
    localStorage.setItem("activeGamesComponent", tab);
    router.push(`/games/${tab}`);
    setOpen(false);
  };

  const displayName = (tab: Tab) => {
    switch(tab) {
      case Tab.dailyDraw:         return "Daily Draw";
      case Tab.lootboxes:         return "Lootboxes";
      case Tab.scratchOffs:       return "Scratch Offs";
      case Tab.stocket:           return "Stocket";
      case Tab.stockPredictor:    return "Stock Predictor";
      case Tab.cryptoMinesweeper: return "Stock Sweeper";
      case Tab.tokenMarket:       return "Token Market";
      case Tab.roulette:          return "Roulette";
      default: return tab;
    }
  };

  const tabIcon = (tab: Tab) => {
    switch(tab) {
      case Tab.dailyDraw:         return <FaHourglassHalf className="w-5 h-5" />;
      case Tab.lootboxes:         return <FaGift         className="w-5 h-5" />;
      case Tab.scratchOffs:       return <FaTicketAlt   className="w-5 h-5" />;
      case Tab.stocket:           return <FaRocket       className="w-5 h-5" />;
      case Tab.stockPredictor:    return <FaChartLine    className="w-5 h-5" />;
      case Tab.cryptoMinesweeper: return <FaBomb         className="w-5 h-5" />;
      case Tab.tokenMarket:       return <FaCoins        className="w-5 h-5" />;
      case Tab.roulette:          return <FaGamepad      className="w-5 h-5" />;
      default:                    return <FaRocket       className="w-5 h-5" />;
    }
  };

  return (
    <div className="flex h-full">
      <div
        ref={sidebarRef}
        className={`fixed lg:relative inset-y-0 left-0 w-64 lg:w-60 bg-gray-800 p-4 border-r border-gray-700 transform transition-transform duration-300 ${
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="mb-4">
          <UserTokenDisplay />
        </div>
        <nav className="space-y-2 sticky top-0">
          {Object.values(Tab).map(tab => (
            <button
              key={tab}
              onClick={() => goTab(tab)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                activeTab === tab
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:bg-gray-700/50"
              }`}
            >
              {tabIcon(tab)}
              <span className="flex-grow text-center">{displayName(tab)}</span>
              {tab === Tab.dailyDraw && (
                <span className="text-xs font-medium px-1.5 py-0.5 bg-gray-700 text-gray-300 rounded ml-1">
                  {timeLeft}
                </span>
              )}
            </button>
          ))}
        </nav>
        <TokenLeaderboard />
      </div>

      <button
        ref={menuButtonRef}
        onClick={toggleSidebar}
        className={`lg:hidden fixed top-16 left-0 z-50 py-3 pl-2 pr-3 rounded-r-lg shadow-md transition-transform ${
          open ? "bg-white text-gray-800 translate-x-64" : "bg-blue-600 text-white"
        }`}
      >
        {open ? <FaAngleLeft className="w-5 h-5" /> : <FaAngleRight className="w-5 h-5" />}
      </button>

      <div className="flex-grow p-4 overflow-y-auto" ref={scrollRef}>
        {children}
      </div>

      <Toaster />
    </div>
  );
}