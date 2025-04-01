"use client";
import React, { useEffect, useState } from "react";

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
        const res = await fetch("/api/user/friends", {
          credentials: "include",
        });
        if (!res.ok) {
          throw new Error("Failed to fetch friends");
        }
        const data = await res.json();
        // Expecting a response like: { friends: Friend[] }
        setFriends(data.friends);
      } catch (err: any) {
        console.error("Error fetching friends:", err);
        setError("Failed to load friends.");
      } finally {
        setLoading(false);
      }
    };

    fetchFriends();
  }, []);

  if (loading) return <div>Loading friends...</div>;
  if (error) return <div className="text-red-400">{error}</div>;

  return (
    <div className="md:col-span-2 bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/10">
      <h2 className="text-2xl font-bold text-white mb-4">Your Friends</h2>
      {friends.length === 0 ? (
        <p className="text-gray-400">You have no friends added yet.</p>
      ) : (
        <ul className="space-y-4">
          {friends.map((friend) => (
            <li key={friend.id} className="flex items-center space-x-4">
              {friend.image ? (
                <img
                  src={friend.image}
                  alt={friend.name || friend.email}
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
                <p className="text-white font-semibold">{friend.name || friend.email}</p>
                <p className="text-gray-400">{friend.email}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default FriendsList;
