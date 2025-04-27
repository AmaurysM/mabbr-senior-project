"use client";

import React, { useEffect, useState } from "react";
import { IoTicket, IoEllipse } from "react-icons/io5";
import { authClient } from "@/lib/auth-client";
import { FaCoins } from "react-icons/fa";

const UserTokenDisplay: React.FC = () => {
  const [tokens, setTokens] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const { data: session } = authClient.useSession();

  // Format token number with commas for thousands
  const formatTokens = (tokens: number) => {
    return tokens.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  useEffect(() => {
    const fetchUserTokens = async () => {
      try {
        if (!session?.user?.id) {
          setLoading(false);
          return;
        }
        
        const res = await fetch("/api/user", { credentials: "include" });
        
        if (!res.ok) {
          console.error("Error fetching user data:", await res.text());
          throw new Error("Failed to fetch user data");
        }
        
        const data = await res.json();
        setTokens(data.tokenCount || 0);
      } catch (err: any) {
        console.error("Error fetching user tokens:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserTokens();
    
    // Set up a listener for local storage changes to refresh tokens
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token-refresh') {
        fetchUserTokens();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Poll for token updates every 30 seconds
    const interval = setInterval(fetchUserTokens, 30000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [session?.user?.id]);

  if (loading) {
    return (
      <div className="bg-gray-700/30 rounded-lg p-3 flex items-center animate-pulse">
        <div className="w-24 h-5 bg-gray-600 rounded"></div>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  return (
    <div className="bg-gray-700/30 rounded-lg p-3 flex items-center justify-between">
      <div className="flex items-center">
        <FaCoins className="text-yellow-400 w-5 h-5 mr-2" />
        <span className="text-white font-medium">My Tokens</span>
      </div>
      <div className="flex items-center bg-gray-800/80 px-3 py-1 rounded-lg">
        <IoEllipse className="text-yellow-400 w-3.5 h-3.5 mr-1.5" />
        <span className="text-white font-semibold">
          {tokens !== null ? formatTokens(tokens) : "..."}
        </span>
      </div>
    </div>
  );
};

export default UserTokenDisplay; 