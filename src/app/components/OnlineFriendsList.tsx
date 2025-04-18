"use client";

import Image from "next/image";
import React, { useEffect, useState } from "react";
import { FaCircle } from "react-icons/fa";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

interface Friend {
  id: string;
  name?: string;
  email: string;
  image?: string;
  lastActive?: string;
  isOnline?: boolean;
}

const OnlineFriendsList: React.FC = () => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const { data: session } = authClient.useSession();
  const router = useRouter();
  
  // Consider a user online if they were active in the last 2 minutes
  // This is more responsive and better aligned with our 30-second polling
  const ONLINE_THRESHOLD_MINUTES = 2;
  
  // Poll for updates every 15 seconds for more responsive display
  const POLLING_INTERVAL_MS = 15000;

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        if (!session?.user?.id) {
          setLoading(false);
          return;
        }
        
        const res = await fetch("/api/user/friends", { credentials: "include" });
        
        if (!res.ok) {
          throw new Error(`Failed to fetch friends: ${res.status} ${res.statusText}`);
        }
        
        const data = await res.json();
        
        // Get currently active sessions to determine who's online
        const sessionsRes = await fetch("/api/user/active-sessions", { 
          credentials: "include" 
        });
        
        let activeSessions: Record<string, string> = {};
        
        if (sessionsRes.ok) {
          const sessionsData = await sessionsRes.json();
          activeSessions = sessionsData.activeSessions || {};
        }
        
        // Map friends and determine online status based on active sessions
        const friendsWithStatus = (data.friends || []).map((friend: Friend) => {
          const lastActiveTime = activeSessions[friend.id];
          
          let isOnline = false;
          
          if (lastActiveTime) {
            // Convert to Date object
            const lastActive = new Date(lastActiveTime);
            const now = new Date();
            
            // Calculate difference in minutes
            const diffMinutes = (now.getTime() - lastActive.getTime()) / (1000 * 60);
            
            // Consider online if active within threshold
            isOnline = diffMinutes < ONLINE_THRESHOLD_MINUTES;
          }
          
          return {
            ...friend,
            lastActive: lastActiveTime,
            isOnline
          };
        });
        
        setFriends(friendsWithStatus);
      } catch (err: any) {
        console.error("Error fetching friends:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFriends();
    
    // Poll for updates more frequently for better real-time experience
    const interval = setInterval(fetchFriends, POLLING_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [session?.user?.id]);

  const handleProfileClick = (userId: string) => {
    sessionStorage.setItem("selectedUserId", userId);
    router.push("/friendsProfile");
  };

  const onlineFriends = friends.filter(friend => friend.isOnline);
  const offlineFriends = friends.filter(friend => !friend.isOnline);

  if (loading) {
    return (
      <div className="space-y-1 px-1">
        <h3 className="text-sm font-semibold text-gray-300 mb-2">Friends</h3>
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center space-x-2 animate-pulse">
              <div className="w-7 h-7 bg-gray-700 rounded-full"></div>
              <div className="h-3 bg-gray-700 rounded w-20"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="space-y-1 px-1">
        <h3 className="text-sm font-semibold text-gray-300 mb-2">Friends</h3>
        <p className="text-xs text-gray-500">Please log in to see friends</p>
      </div>
    );
  }

  if (friends.length === 0) {
    return (
      <div className="space-y-1 px-1">
        <h3 className="text-sm font-semibold text-gray-300 mb-2">Friends</h3>
        <p className="text-xs text-gray-500">No friends added yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 px-1">
      {/* Online Friends Section */}
      <div>
        <h3 className="text-sm font-semibold text-gray-300 mb-2">
          Online — {onlineFriends.length}
        </h3>
        <ul className="space-y-2">
          {onlineFriends.map((friend) => (
            <li key={friend.id}>
              <button 
                onClick={() => handleProfileClick(friend.id)}
                className="w-full flex items-center space-x-2 text-gray-300 hover:bg-gray-700/50 rounded-lg p-1.5 transition-colors text-left"
              >
                <div className="relative">
                  {friend.image ? (
                    <Image
                      src={friend.image}
                      alt={friend.name || friend.email}
                      width={28}
                      height={28}
                      className="w-7 h-7 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-7 h-7 bg-gray-700 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">
                        {friend.name ? friend.name.charAt(0) : friend.email.charAt(0)}
                      </span>
                    </div>
                  )}
                  <FaCircle className="absolute bottom-0 right-0 text-green-500 text-xs" />
                </div>
                <span className="text-sm truncate">
                  {friend.name || friend.email.split('@')[0]}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Divider */}
      {offlineFriends.length > 0 && onlineFriends.length > 0 && (
        <div className="border-t border-gray-700"></div>
      )}

      {/* Offline Friends Section */}
      {offlineFriends.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-300 mb-2">
            Offline — {offlineFriends.length}
          </h3>
          <ul className="space-y-2">
            {offlineFriends.map((friend) => (
              <li key={friend.id}>
                <button 
                  onClick={() => handleProfileClick(friend.id)}
                  className="w-full flex items-center space-x-2 text-gray-500 hover:bg-gray-700/50 rounded-lg p-1.5 transition-colors text-left"
                >
                  <div className="relative">
                    {friend.image ? (
                      <Image
                        src={friend.image}
                        alt={friend.name || friend.email}
                        width={28}
                        height={28}
                        className="w-7 h-7 rounded-full object-cover grayscale"
                      />
                    ) : (
                      <div className="w-7 h-7 bg-gray-700 rounded-full flex items-center justify-center">
                        <span className="text-gray-400 text-xs">
                          {friend.name ? friend.name.charAt(0) : friend.email.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>
                  <span className="text-sm truncate">
                    {friend.name || friend.email.split('@')[0]}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default OnlineFriendsList; 