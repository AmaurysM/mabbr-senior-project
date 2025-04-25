"use client";

import Image from "next/image";
import React, { useEffect, useState } from "react";
import { FaCircle } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

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

  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    friend: Friend | null;
  }>({ visible: false, x: 0, y: 0, friend: null });

  const [activeChats, setActiveChats] = useState<Friend[]>([]);

  const ONLINE_THRESHOLD_MINUTES = 2;
  const POLLING_INTERVAL_MS = 15000;

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        if (!session?.user?.id) {
          setLoading(false);
          return;
        }

        const res = await fetch("/api/user/friends", { credentials: "include" });
        if (!res.ok) throw new Error(`Failed to fetch friends: ${res.status}`);

        const data = await res.json();

        const sessionsRes = await fetch("/api/user/active-sessions", {
          credentials: "include",
        });

        let activeSessions: Record<string, string> = {};
        if (sessionsRes.ok) {
          const sessionsData = await sessionsRes.json();
          activeSessions = sessionsData.activeSessions || {};
        }

        const friendsWithStatus = (data.friends || []).map((friend: Friend) => {
          const lastActiveTime = activeSessions[friend.id];
          let isOnline = false;

          if (lastActiveTime) {
            const lastActive = new Date(lastActiveTime);
            const now = new Date();
            const diffMinutes = (now.getTime() - lastActive.getTime()) / (1000 * 60);
            isOnline = diffMinutes < ONLINE_THRESHOLD_MINUTES;
          }

          return {
            ...friend,
            lastActive: lastActiveTime,
            isOnline,
          };
        });

        setFriends(friendsWithStatus);
      } catch (err) {
        console.error("Error fetching friends:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFriends();
    const interval = setInterval(fetchFriends, POLLING_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [session?.user?.id]);

  const handleProfileClick = (userId: string) => {
    sessionStorage.setItem("selectedUserId", userId);
    router.push("/friendsProfile");
  };

  const handleRightClick = (
    e: React.MouseEvent<HTMLButtonElement>,
    friend: Friend
  ) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const scrollY = window.scrollY;
    const scrollX = window.scrollX;
  
    const menuWidth = 130;
    const menuHeight = 36;
  
    // Center horizontally over the button, vertically just above it
    const x = scrollX + rect.left + rect.width / 2 - menuWidth / 2;
    const y = scrollY + rect.top + rect.height / 2 - menuHeight; // shift up more
  
    setContextMenu({
      visible: true,
      x,
      y,
      friend,
    });
  };
  

  const onlineFriends = friends.filter((f) => f.isOnline);
  const offlineFriends = friends.filter((f) => !f.isOnline);

  useEffect(() => {
    const closeContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".custom-context-menu")) {
        setContextMenu({ visible: false, x: 0, y: 0, friend: null });
      }
    };
    window.addEventListener("click", closeContextMenu);
    return () => window.removeEventListener("click", closeContextMenu);
  }, []);

  return (
    <div className="space-y-4 px-1 relative">
      <h3 className="text-sm font-semibold text-gray-300 mb-2">
        Online — {onlineFriends.length}
      </h3>
      <ul className="space-y-2">
        {onlineFriends.map((friend) => (
          <li key={friend.id}>
            <button
              onClick={() => handleProfileClick(friend.id)}
              onContextMenu={(e) => handleRightClick(e, friend)}
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
                      {friend.name?.charAt(0) || friend.email.charAt(0)}
                    </span>
                  </div>
                )}
                <FaCircle className="absolute bottom-0 right-0 text-green-500 text-xs" />
              </div>
              <span className="text-sm truncate">
                {friend.name || friend.email.split("@")[0]}
              </span>
            </button>
          </li>
        ))}
      </ul>

      {offlineFriends.length > 0 && onlineFriends.length > 0 && (
        <div className="border-t border-gray-700"></div>
      )}

      {offlineFriends.length > 0 && (
        <>
          <h3 className="text-sm font-semibold text-gray-300 mb-2">
            Offline — {offlineFriends.length}
          </h3>
          <ul className="space-y-2">
            {offlineFriends.map((friend) => (
              <li key={friend.id}>
                <button
                  onClick={() => handleProfileClick(friend.id)}
                  onContextMenu={(e) => handleRightClick(e, friend)}
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
                          {friend.name?.charAt(0) || friend.email.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>
                  <span className="text-sm truncate">
                    {friend.name || friend.email.split("@")[0]}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

{/* Context Menu */}
{contextMenu.visible && contextMenu.friend && (
  <div
    className="fixed custom-context-menu bg-gray-900 border border-gray-700 rounded-full px-3 py-1 shadow text-sm text-white z-50 transition-opacity duration-150"
    style={{
      top: contextMenu.y - 70,
      left: contextMenu.x + 75,
      width: 108,
      textAlign: "center",
    }}
  >
    <button
      onClick={(e) => {
        e.stopPropagation();
        setActiveChats((prev) =>
          prev.some((f) => f.id === contextMenu.friend!.id)
            ? prev
            : [...prev, contextMenu.friend!]
        );
        setContextMenu({ visible: false, x: 0, y: 0, friend: null });
      }}
      className="hover:bg-gray-700 w-full py-1 rounded-full flex justify-center items-center gap-2"
    >
      💬 Message
    </button>
  </div>
)}



{/* Chat Popups */}
{activeChats.map((friend) => (
  <div
    key={friend.id}
    className="fixed bottom-4 left-1 bg-gray-900 text-white w-[80vw] max-w-[235px] p-4 rounded-xl shadow-xl z-50"
  >
    {/* Header */}
    <div className="flex justify-between items-center mb-3">
      <span className="font-semibold text-sm truncate">
        {friend.name || friend.email}
      </span>
      <button
        className="text-white hover:text-red-400 text-xl px-2"
        onClick={() =>
          setActiveChats((prev) => prev.filter((f) => f.id !== friend.id))
        }
      >
        &times;
      </button>
    </div>

    {/* Message Area */}
    <div className="bg-gray-800 px-3 py-2 h-32 mb-3 rounded-lg overflow-y-auto text-sm">
      <p className="text-gray-400 italic">
        Chat with {friend.name || friend.email} coming soon...
      </p>
    </div>

    {/* Input */}
    <input
      type="text"
      className="w-full px-3 py-2 text-sm bg-gray-700 text-white placeholder-gray-400 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
      placeholder="Type a message..."
    />
  </div>
))}

    </div>
  );
};

export default OnlineFriendsList;
