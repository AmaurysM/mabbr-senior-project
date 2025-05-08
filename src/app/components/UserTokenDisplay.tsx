"use client";

import React, { useEffect, useState } from "react";
import { IoEllipse } from "react-icons/io5";
import { authClient } from "@/lib/auth-client";
import { FaCoins } from "react-icons/fa";
export function abbreviateNumber(value: number): string {
  if (value < 1000) return value.toString();
  const suffixes = ["", "K", "M", "B", "T"];
  const tier = Math.floor(Math.log10(value) / 3);
  const scaled = value / Math.pow(10, tier * 3);
  return scaled.toFixed(1).replace(/\.0$/, "") + suffixes[tier];
}

const UserTokenDisplay: React.FC = () => {
  const [tokens, setTokens] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const { data: session } = authClient.useSession();

  useEffect(() => {
    const fetchUserTokens = async () => {
      try {
        if (!session?.user?.id) {
          setLoading(false);
          return;
        }
        
        // Try to get the user data
        const res = await fetch("/api/user", { 
          credentials: "include",
          cache: "no-store" // Prevent caching
        });
        
        if (res.ok) {
          const data = await res.json();
          if (data && typeof data.tokenCount === 'number') {
            setTokens(data.tokenCount);
            
            // Store in localStorage for future reference
            if (typeof window !== 'undefined') {
              localStorage.setItem(`user-${session.user.id}-tokens`, data.tokenCount.toString());
            }
          } else {
            // Try to get from localStorage if API doesn't return valid data
            const storedTokens = localStorage.getItem(`user-${session.user.id}-tokens`);
            if (storedTokens) {
              setTokens(parseInt(storedTokens, 10));
            } else {
              setTokens(0);
            }
          }
        } else {
          // If API fails, try localStorage
          const storedTokens = localStorage.getItem(`user-${session.user.id}-tokens`);
          if (storedTokens) {
            setTokens(parseInt(storedTokens, 10));
          } else {
            setTokens(0);
          }
        }
      } catch (err) {
        console.error("Error fetching user tokens:", err);
        
        // Try localStorage as fallback
        if (typeof window !== 'undefined' && session?.user?.id) {
          const storedTokens = localStorage.getItem(`user-${session.user.id}-tokens`);
          if (storedTokens) {
            setTokens(parseInt(storedTokens, 10));
          } else {
            setTokens(0);
          }
        } else {
          setTokens(0);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserTokens();
    
    // Listen for token refresh events via storage events
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token-refresh' || 
          e.key === 'token-balance-updated' || 
          (session?.user?.id && e.key === `user-${session.user.id}-tokens`)) {
        fetchUserTokens();
      }
    };
    
    // Listen for direct token update events
    const handleTokenUpdate = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail && typeof customEvent.detail.newBalance === 'number') {
        // If we have the new balance directly, use it without an API call
        setTokens(customEvent.detail.newBalance);
        
        // Also update localStorage
        if (typeof window !== 'undefined' && session?.user?.id) {
          localStorage.setItem(`user-${session.user.id}-tokens`, customEvent.detail.newBalance.toString());
        }
      } else {
        // Otherwise refresh from the API
        fetchUserTokens();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('token-balance-updated', handleTokenUpdate);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('token-balance-updated', handleTokenUpdate);
    };
  }, [session?.user?.id]);

  if (loading && tokens === null) {
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
          {tokens !== null ? abbreviateNumber(tokens) : "..."}
        </span>
      </div>
    </div>
  );
};

export default UserTokenDisplay; 