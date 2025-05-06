"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Toaster } from "@/app/components/ui/sonner";
import { FaAngleLeft, FaAngleRight, FaBell, FaHashtag, FaUsers } from "react-icons/fa";
import { IoIosDocument } from "react-icons/io";
import GlobalFeed from "./globalFeed/page";
import Notifications from "./notifications/page";
import Articles from "./articles/page";
import Topics from "./topics/page";
import OnlineFriendsList from "../components/OnlineFriendsList";

enum Tab {
  globalFeed = "globalFeed",
  topics = "topics",
  articles = "articles",
  notifications = "notifications",
}

const CommunityPage = () => {
  const [activeComponent, setActiveComponent] = useState<Tab>(Tab.globalFeed);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

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

      default:
        return tab; // Fallback, though this won't occur with the enum
    }
  };

  return (
    <div className="flex h-full">
      {/* Left Sidebar (Fixed) */}
      <div ref={sidebarRef}
        className={`fixed lg:relative inset-y-0 left-0 w-64 lg:w-60 min-w-60 overflow-y-auto bg-gray-800 p-4 border-r border-gray-700 z-50 transform transition-transform duration-300 lg:translate-x-0 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}>
        <nav className="space-y-2 sticky top-0">
          {Object.values(Tab).map((value) => (
            <button
              key={value}
              onClick={() => {setActiveComponent(value);
                setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeComponent === value
                ? "bg-blue-600 text-white"
                : "text-gray-300 hover:bg-gray-700/50"
                }`}
            >
              {value === Tab.globalFeed && <FaUsers className="w-5 h-5" />}
              {value === Tab.topics && <FaHashtag className="w-5 h-5" />}
              {value === Tab.articles && <IoIosDocument className="w-5 h-5" />}
              {value === Tab.notifications && <FaBell className="w-5 h-5" />}
              <span>{getDisplayName(value)}</span>
            </button>
          ))}
                  {/* Friends List */}
        <div className="mt-8">
          <OnlineFriendsList />
        </div>
          
        </nav>
        
 
      </div>

      <button
        ref={menuButtonRef}
        onClick={toggleSidebar}
        className={`lg:hidden fixed top-30 left-0 z-50 shadow-md transition-all duration-300 ${isSidebarOpen
            ? "bg-white text-gray-800 translate-x-64"
            : "bg-blue-600 text-white"
          } py-3 pl-2 pr-3 rounded-r-lg flex items-center justify-center`}
        aria-label={isSidebarOpen ? "Close notes list" : "Open notes list"}
        aria-expanded={isSidebarOpen}
      >
        {isSidebarOpen ? (
          <FaAngleLeft className="w-5 h-5" />
        ) : (
          <FaAngleRight className="w-5 h-5" />
        )}
      </button>

      {/* Right Content (Scrollable) */}
      <div ref={scrollRef} className="flex-grow h-full overflow-y-auto p-4">
        {activeComponent === Tab.globalFeed && <GlobalFeed />}
        {activeComponent === Tab.topics && <Topics />}
        {activeComponent === Tab.articles && <Articles />}
        {activeComponent === Tab.notifications && <Notifications />}
      </div>

      <Toaster />
    </div>
  );
};

export default CommunityPage;