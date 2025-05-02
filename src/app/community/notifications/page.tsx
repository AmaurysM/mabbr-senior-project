"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Bell, Gift, Trophy } from "lucide-react";
import toast from "react-hot-toast";
import useSWRInfinite from "swr/infinite";

interface NotificationItem {
  id: string;
  type: "FRIEND_REQUEST" | "DAILY_DRAW_WIN";
  status?: "pending" | "accepted" | "rejected";
  createdAt: string;
  friendInfo?: {
    id: string;
    name: string;
    email: string;
    hasPosted: boolean;
  };
  tokens?: number;
  drawDate?: string;
}

interface NotificationsResponse {
  success: boolean;
  notifications: NotificationItem[];
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("Failed to fetch notifications");
  }
  return res.json();
};

const getKey = (pageIndex: number, previousPageData: NotificationsResponse | null) => {
  if (previousPageData && !previousPageData.notifications.length) return null;
  return `/api/user/notifications?skip=${pageIndex * 10}&take=10`;
};

const Notifications = () => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const loaderRef = useRef<HTMLDivElement>(null);

  const { data, error, size, setSize, isValidating, mutate } = useSWRInfinite<NotificationsResponse>(
    getKey,
    fetcher,
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      persistSize: true,
    }
  );

  const allNotifications = data ? data.flatMap((page) => page.notifications) : [];
  const isEmpty = data?.[0]?.notifications.length === 0;
  const isReachingEnd = isEmpty || (data && data[data.length - 1]?.notifications.length < 10);
  const isLoadingMore = isValidating || (size > 0 && data && typeof data[size - 1] === "undefined");

  const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
    const [entry] = entries;
    setIsIntersecting(entry.isIntersecting);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(handleObserver, { threshold: 0.5 });
    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }
    return () => {
      if (loaderRef.current) {
        observer.unobserve(loaderRef.current);
      }
    };
  }, [handleObserver]);

  useEffect(() => {
    if (isIntersecting && !isReachingEnd && !isLoadingMore) {
      setSize(size + 1);
    }
  }, [isIntersecting, isReachingEnd, isLoadingMore, setSize, size]);

  const handleAcceptRequest = async (requestId: string) => {
    try {
      const loadingToast = toast.loading("Accepting friend request...");
      const response = await fetch("/api/user/accept-friend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId }),
      });
      toast.dismiss(loadingToast);
      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || "Friend request accepted");
        mutate(); // Refresh notifications after accepting
      } else {
        toast.error(data.error || "Failed to accept friend request");
      }
    } catch (error) {
      toast.error("Failed to accept friend request");
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      const loadingToast = toast.loading("Rejecting friend request...");
      const response = await fetch("/api/user/reject-friend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId }),
      });
      toast.dismiss(loadingToast);
      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || "Friend request rejected");
        mutate(); // Refresh notifications after rejecting
      } else {
        toast.error(data.error || "Failed to reject friend request");
      }
    } catch (error) {
      toast.error("Failed to reject friend request");
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const response = await fetch("/api/user/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationIds: [notificationId] }),
      });

      if (response.ok) {
        mutate(); // Refresh notifications after marking as read
      } else {
        console.error("Failed to mark notification as read");
      }
    } catch (error) {
      console.error("Failed to mark notification as read", error);
    }
  };

  if (error) {
    return (
      <div className="w-full p-4 text-red-500 bg-red-100 rounded-md">
        Failed to load notifications: {error.message}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-64 w-full">
        Loading notifications...
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col overflow-auto">
      {isEmpty ? (
        <div className="flex flex-col items-center justify-center flex-grow">
          <Bell className="w-12 h-12 text-gray-500" />
          <p className="text-gray-400 mt-2">No notifications</p>
        </div>
      ) : (
        <div className="flex-grow">
          <ul className="w-full space-y-2">
            {allNotifications.map((notification) => (
              <li
                key={notification.id}
                className="w-full p-4 border-b border-gray-700 bg-gray-900 text-gray-200 flex justify-between items-center"
              >
                {notification.type === "FRIEND_REQUEST" ? (
                  // Friend request notification
                  <>
                    <div>
                      <div className="text-base font-semibold">
                        {notification.friendInfo?.name} ({notification.friendInfo?.email})
                      </div>
                      <p className="text-xs text-gray-400">
                        {notification.status === "pending" ? "Sent request" : "Became friends"} on{" "}
                        {new Date(notification.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    {notification.status === "pending" && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleAcceptRequest(notification.id)}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded-lg text-sm transition-colors"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleRejectRequest(notification.id)}
                          className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded-lg text-sm transition-colors"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </>
                ) : notification.type === "DAILY_DRAW_WIN" ? (
                  // Daily Draw win notification
                  <>
                    <div className="flex items-center">
                      <Trophy className="w-5 h-5 text-yellow-500 mr-3" />
                      <div>
                        <div className="text-base font-semibold">
                          Daily Draw Winner!
                        </div>
                        <p className="text-sm text-yellow-300 font-medium">
                          You won {notification.tokens?.toLocaleString()} tokens
                        </p>
                        <p className="text-xs text-gray-400">
                          From the drawing on {notification.drawDate}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleMarkAsRead(notification.id)}
                      className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded-lg text-sm transition-colors"
                    >
                      Dismiss
                    </button>
                  </>
                ) : null}
              </li>
            ))}
          </ul>

          <div ref={loaderRef} className="h-10 flex justify-center items-center">
            {!isReachingEnd && isLoadingMore && <p>Loading more...</p>}
          </div>
        </div>
      )}
    </div>
  );
};

export default Notifications;
