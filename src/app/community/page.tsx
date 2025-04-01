"use client";

import React, { useState, useEffect, useRef } from "react";
import { Toaster } from "@/app/components/ui/sonner";
import { FaBell, FaHashtag, FaUser, FaUsers } from "react-icons/fa";
import { IoIosDocument } from "react-icons/io";
import GlobalFeed from "./globalFeed/page";
import Notifications from "./notifications/page";
import Articles from "./articles/page";
import MyPage from "./myPage/page";
import Topics from "./topics/page";

enum Tab {
  globalFeed = "globalFeed",
  topics = "topics",
  articles = "articles",
  notifications = "notifications",
  myPage = "myPage",
}

const CommunityPage = () => {
  const [activeComponent, setActiveComponent] = useState<Tab>(Tab.globalFeed);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const storedActive = localStorage.getItem("activeComponent");
    if (storedActive && storedActive in Tab) {
      setActiveComponent(storedActive as Tab);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("activeComponent", activeComponent);
  }, [activeComponent]);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, 0);
  }, [activeComponent]);

  const getDisplayName = (tab: Tab) => {
    switch (tab) {
      case Tab.globalFeed:
        return "Global Feed";
      case Tab.topics:
        return "Topics";
      case Tab.articles:
        return "Articles";
      case Tab.notifications:
        return "Notifications";
      case Tab.myPage:
        return "My Page";
      default:
        return tab; // Fallback, though this won't occur with the enum
    }
  };

  return (
    <div className="flex h-full">
      {/* Left Sidebar (Fixed) */}
      <div className="w-64 h-full flex-shrink-0 bg-gray-800 p-4 border-r border-gray-700">
        <nav className="space-y-2 sticky top-0">
          {Object.values(Tab).map((value) => (
            <button
              key={value}
              onClick={() => setActiveComponent(value)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                activeComponent === value
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:bg-gray-700/50"
              }`}
            >
              {value === Tab.globalFeed && <FaUsers className="w-5 h-5" />}
              {value === Tab.topics && <FaHashtag className="w-5 h-5" />}
              {value === Tab.articles && <IoIosDocument className="w-5 h-5" />}
              {value === Tab.notifications && <FaBell className="w-5 h-5" />}
              {value === Tab.myPage && <FaUser className="w-5 h-5" />}
              <span>{getDisplayName(value)}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Right Content (Scrollable) */}
      <div ref={scrollRef} className="flex-grow h-full overflow-y-auto p-4">
        {activeComponent === Tab.globalFeed && <GlobalFeed />}
        {activeComponent === Tab.topics && <Topics />}
        {activeComponent === Tab.articles && <Articles />}
        {activeComponent === Tab.notifications && <Notifications />}
        {activeComponent === Tab.myPage && <MyPage />}
      </div>

      <Toaster />
    </div>
  );
};

export default CommunityPage;