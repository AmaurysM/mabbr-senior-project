'use client';

import React, { useState, useEffect } from 'react';

import { Toaster } from "@/app/components/ui/sonner";
import LoadingStateAnimation from '../components/LoadingState';
import { FaBell, FaHashtag, FaUser, FaUsers } from 'react-icons/fa';
import { IoIosDocument } from 'react-icons/io';
import GlobalFeed from './globalFeed/page';
import Notifications from './notifications/page';
import Articles from './articles/page';
import MyPage from './myPage/page';

enum Tab {
  globalFeed = "globalFeed",
  topics = "topics",
  articles = "articles",
  notifications = "notifications",
  myPage = "myPage",
}

const CommunityPage = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [activeComponent, setActiveComponent] = useState<Tab>(() => {
    return typeof window !== 'undefined' 
      ? (localStorage.getItem('activeComponent') as Tab) || Tab.globalFeed 
      : Tab.globalFeed;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('activeComponent', activeComponent);
    }
  }, [activeComponent]);

  useEffect(() => {
    const init = async () => {
      try {
        const res = await fetch('/api/auth/get-session');

        if (!res.ok) {
          console.error('Auth response not OK:', res.status);
          setLoading(false);
          return;
        }

        const data = await res.json();

        if (data.user) {
          setUser(data.user);
        }

        setLoading(false);
      } catch (error) {
        console.error('Error during initialization:', error);
        setLoading(false);
      }
    };

    init();
  }, []);

  if (loading) return <div className="flex justify-center items-center h-screen"><LoadingStateAnimation /></div>;

  return (
    <div className="px-4 py-6 w-full h-full max-w-[1920px] mx-auto flex">
      <Toaster />
      <div className="w-64 flex-shrink-0 mr-6">
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-white/10 sticky top-6">
          <div className="flex items-center justify-center mb-6 p-2">
            <h1 className="text-xl font-bold text-white">StockSocial</h1>
          </div>
          <nav className="space-y-2">
            {Object.entries(Tab).map(([key, value]) => (
              <button
                key={key}
                onClick={() => setActiveComponent(value)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeComponent === value
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-700/50'
                  }`}
              >
                {value === Tab.globalFeed && <FaUsers className="w-5 h-5" />}
                {value === Tab.topics && <FaHashtag className="w-5 h-5" />}
                {value === Tab.articles && <IoIosDocument className="w-5 h-5" />}
                {value === Tab.notifications && <FaBell className="w-5 h-5" />}
                {value === Tab.myPage && <FaUser className="w-5 h-5" />}
                <span>{key}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="flex-grow">
        {activeComponent === Tab.globalFeed && <GlobalFeed user={user} />}
        {activeComponent === Tab.notifications && <Notifications />}
        {activeComponent === Tab.articles && <Articles />}
        {activeComponent === Tab.myPage && <MyPage user={user} />}
      </div>
    </div>
  );
};

export default CommunityPage;
