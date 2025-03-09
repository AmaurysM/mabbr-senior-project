'use client';

import React, { useState, useEffect } from 'react';

import { Toaster } from "@/app/components/ui/sonner"
import LoadingStateAnimation from '../components/LoadingState';
import { FaBell, FaHashtag, FaUser, FaUsers } from 'react-icons/fa';
import { IoIosDocument } from 'react-icons/io';
import GlobalFeed from './globalFeed/page';
import Notifications from './notifications/page';
import Articles from './articles/page';

const CommunityPage = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [activeComponent, setActiveComponent] = useState(() => {
    return typeof window !== 'undefined' ? localStorage.getItem('activeComponent') || 'globalFeed' : 'globalFeed';
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
      {/* Left Navigation Bar */}
      <div className="w-64 flex-shrink-0 mr-6">
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-white/10 sticky top-6">
          <div className="flex items-center justify-center mb-6 p-2">
            <h1 className="text-xl font-bold text-white">StockSocial</h1>
          </div>
          <nav className="space-y-2">
            <button
              onClick={() => setActiveComponent('globalFeed')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeComponent === 'globalFeed'
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:bg-gray-700/50'
                }`}
            >
              <FaUsers className="w-5 h-5" />
              <span>Global Feed</span>
            </button>
            <button
              onClick={() => setActiveComponent('topics')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeComponent === 'topics'
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:bg-gray-700/50'
                }`}
            >
              <FaHashtag className="w-5 h-5" />
              <span>Topics</span>
            </button>
            <button
              onClick={() => setActiveComponent('articles')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeComponent === 'articles'
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:bg-gray-700/50'
                }`}
            >
              <IoIosDocument className="w-5 h-5" />
              <span>Articles</span>
            </button>
            <button
              onClick={() => setActiveComponent('notifications')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeComponent === 'notifications'
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:bg-gray-700/50'
                }`}
            >
              <FaBell className="w-5 h-5" />
              <span>Notifications</span>
            </button>
            <button
              onClick={() => setActiveComponent('myPage')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeComponent === 'myPage'
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:bg-gray-700/50'
                }`}
            >
              <FaUser className="w-5 h-5" />
              <span>My Page</span>
            </button>
          </nav>
        </div>
        
      </div>

      <div className="flex-grow">
          {/* Conditional rendering based on active component */}
          {activeComponent === 'globalFeed' && <GlobalFeed user={user}/>}
          {activeComponent === 'notifications' && <Notifications user={user}/>}
          {activeComponent === 'articles' && <Articles/>}

      </div>
    </div>
  );
};

export default CommunityPage;
