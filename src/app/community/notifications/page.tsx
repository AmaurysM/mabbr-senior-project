"use client";

import React, { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import LoadingStateAnimation from "@/app/components/LoadingState";
import { FriendRequests } from "@/lib/prisma_types";

const Notifications = () => {
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<FriendRequests>([]);
  const [loadingFriendActivity, setLoadingFriendActivity] = useState(true);
  const [friendTransactions, setFriendTransactions] = useState<any[]>([]);



  // Add a new function to fetch friend transactions
  const fetchFriendTransactions = async () => {
      setLoadingFriendActivity(false);


    try {
      const res = await fetch('/api/user/transactions', {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
      const data = await res.json();

      if (data.success) {
        // Filter only friend transactions (where isCurrentUser is false)
        const friendActivity = data.transactions.filter((tx: any) => tx.isCurrentUser === false);
        setFriendTransactions(friendActivity);
      }

      setLoadingFriendActivity(false);
    } catch (error) {
      console.error('Error fetching friend transactions:', error);
      setLoadingFriendActivity(false);
    }
  };

  useEffect(() => {
      fetchFriendTransactions();
  
      
        const intervalId = setInterval(() => {
          fetchFriendTransactions();
        }, 30000);
  
        return () => clearInterval(intervalId);
      
    });

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/user/notifications");
        const data: FriendRequests = await response.json();
        setNotifications(data || []);
      } catch (error) {
        console.error("Error fetching notifications:", error);
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen w-full">
        <LoadingStateAnimation />
      </div>
    );
  }

  return (
    <div className="w-full h-screen flex flex-col">
      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-grow">
          <Bell className="w-12 h-12 text-gray-500" />
          <p className="text-gray-400 mt-2">No notifications</p>
        </div>
      ) : (
        <div className="flex-grow overflow-y-auto">
          <ul className="w-full space-y-2">
            {notifications.map((notification) => (
              <li
                key={notification.id}
                className="w-full p-4 border-b border-gray-700 bg-gray-900 text-gray-200"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-base font-semibold">
                      {notification.requester.name} ({notification.requester.email})
                    </p>
                    <p className="text-xs text-gray-400">
                      Sent request on {new Date(notification.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Notifications;
