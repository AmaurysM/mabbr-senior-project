"use client";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import SkeletonLoader from "@/app/components/SkeletonLoader";

interface Friend {
  id: string;
  name?: string;
  email: string;
  image?: string;
}

const FriendsList: React.FC = () => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const res = await fetch("/api/user/friends", { credentials: "include" });
        
        if (!res.ok) {
          throw new Error(`Failed to fetch friends: ${res.status} ${res.statusText}`);
        }
        
        const data = await res.json();
        setFriends(data.friends || []);
      } catch (err: any) {
        console.error("Error fetching friends:", err);
        setError(err.message || "Failed to load friends");
      } finally {
        setLoading(false);
      }
    };

    fetchFriends();
  }, []);

  if (error) {
    return (
      <div className="md:col-span-2 bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-white/10">
        <h2 className="text-2xl font-bold text-white mb-4">Your Friends</h2>
        <div className="text-red-400 p-4 bg-red-900/20 rounded-lg">
          Error: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="md:col-span-2 bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/10">
      <h2 className="text-2xl font-bold text-white mb-4">
        {loading ? (
          <SkeletonLoader className="h-8 w-48 rounded-md" />
        ) : (
          "Your Friends"
        )}
      </h2>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4">
              <SkeletonLoader className="w-12 h-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <SkeletonLoader className="h-4 w-32 rounded-md" />
                <SkeletonLoader className="h-3 w-24 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      ) : friends.length === 0 ? (
        <p className="text-gray-400 p-4 bg-gray-700/20 rounded-lg">
          No friends added yet. Start by adding some friends!
        </p>
      ) : (
        <ul className="space-y-4">
          {friends.map((friend) => (
            <li key={friend.id} className="flex items-center space-x-4">
              {friend.image ? (
                <Image
                  src={friend.image}
                  alt={friend.name || friend.email}
                  width={40}
                  height={40}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center">
                  <span className="text-white">
                    {friend.name ? friend.name.charAt(0) : friend.email.charAt(0)}
                  </span>
                </div>
              )}
              <div>
                <p className="text-white font-semibold">
                  {friend.name || friend.email.split('@')[0]}
                </p>
                <p className="text-gray-400 text-sm">{friend.email}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default FriendsList;