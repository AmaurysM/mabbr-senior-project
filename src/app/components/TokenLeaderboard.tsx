"use client";

import Image from "next/image";
import React, { useEffect, useState } from "react";
import { IoEllipse } from "react-icons/io5";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

interface TokenUser {
  id: string;
  name?: string;
  email: string;
  image?: string;
  tokens: number;
}

const TokenLeaderboard: React.FC = () => {
  const [users, setUsers] = useState<TokenUser[]>([]);
  const [loading, setLoading] = useState(true);
  const { data: session } = authClient.useSession();
  const router = useRouter();

  // Poll for updates every minute for more responsive display
  const POLLING_INTERVAL_MS = 60000;

  useEffect(() => {
    const fetchTokenLeaderboard = async () => {
      try {
        if (!session?.user?.id) {
          setLoading(false);
          return;
        }
        
        // Use the actual API endpoint for token leaderboard
        const res = await fetch("/api/user/token-leaderboard", { credentials: "include" });
        
        if (!res.ok) {
          console.error("Error fetching token leaderboard:", await res.text());
          throw new Error("Failed to fetch token leaderboard");
        }
        
        const data = await res.json();
        // Sort by tokens in descending order and limit to top 5
        const sortedUsers = (data.users || [])
          .sort((a: TokenUser, b: TokenUser) => b.tokens - a.tokens)
          .slice(0, 5); // Show only top 5 users
        
        setUsers(sortedUsers);
      } catch (err: any) {
        console.error("Error fetching token leaderboard:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTokenLeaderboard();
    
    // Poll for updates
    const interval = setInterval(fetchTokenLeaderboard, POLLING_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [session?.user?.id]);

  const handleProfileClick = (userId: string) => {
    sessionStorage.setItem("selectedUserId", userId);
    router.push("/friendsProfile");
  };

  // Format token number with commas for thousands
  const formatTokens = (tokens: number) => {
    return tokens.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  if (loading) {
    return (
      <div className="space-y-1 px-1">
        <h3 className="text-sm font-semibold text-gray-300 mb-2">Token Leaderboard</h3>
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-2 animate-pulse">
              <div className="w-7 h-7 bg-gray-700 rounded-full"></div>
              <div className="h-3 bg-gray-700 rounded w-20"></div>
              <div className="h-3 bg-gray-700 rounded w-10 ml-auto"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="space-y-1 px-1">
        <h3 className="text-sm font-semibold text-gray-300 mb-2">Token Leaderboard</h3>
        <p className="text-xs text-gray-500">Please log in to see leaderboard</p>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="space-y-1 px-1">
        <h3 className="text-sm font-semibold text-gray-300 mb-2">Token Leaderboard</h3>
        <p className="text-xs text-gray-500">No token data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 px-1">
      <h3 className="text-sm font-semibold text-gray-300 mb-2">
        Token Leaderboard
      </h3>
      <ul className="space-y-2 pr-1">
        {users.map((user, index) => (
          <li key={user.id}>
            <button 
              onClick={() => handleProfileClick(user.id)}
              className={`w-full flex items-center space-x-2 text-gray-300 hover:bg-gray-700/50 rounded-lg p-1.5 transition-colors text-left ${user.id === session.user.id ? 'bg-gray-700/30' : ''}`}
            >
              <div className="w-5 flex justify-center text-xs font-semibold text-gray-400">
                {index + 1}
              </div>
              <div className="relative">
                {user.image ? (
                  <Image
                    src={user.image}
                    alt={user.name || user.email}
                    width={28}
                    height={28}
                    className="w-7 h-7 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-7 h-7 bg-gray-700 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">
                      {user.name ? user.name.charAt(0) : user.email.charAt(0)}
                    </span>
                  </div>
                )}
              </div>
              <span className="text-sm truncate max-w-[90px]">
                {user.name || user.email.split('@')[0]}
                {user.id === session.user.id && " (You)"}
              </span>
              <div className="flex items-center ml-auto">
                <IoEllipse className="text-yellow-400 w-3.5 h-3.5 mr-1" />
                <span className="text-xs font-semibold text-gray-300">{formatTokens(user.tokens)}</span>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TokenLeaderboard; 