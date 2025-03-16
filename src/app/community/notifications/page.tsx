"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Bell } from "lucide-react";
import LoadingStateAnimation from "@/app/components/LoadingState";
import useSWRInfinite from "swr/infinite";

interface NotificationItem {
  id: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
  friendInfo: {
    id: string;
    name: string;
    email: string;
    hasPosted: boolean;
  };
}

interface NotificationsResponse {
  success: boolean;
  notifications: NotificationItem[];
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('Failed to fetch notifications');
  }
  return res.json();
};

const getKey = (pageIndex: number, previousPageData: NotificationsResponse | null) => {
  if (previousPageData && !previousPageData.notifications.length) return null;

  if (pageIndex === 0) return `/api/user/notifications?skip=0&take=10`;

  return `/api/user/notifications?skip=${pageIndex * 10}&take=10`;
};

const Notifications = () => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const loaderRef = useRef<HTMLDivElement>(null);

  const { data, error, size, setSize, isValidating } = useSWRInfinite<NotificationsResponse>(
    getKey,
    fetcher,
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      persistSize: true,
    }
  );

  const allNotifications = data ? data.flatMap(page => page.notifications) : [];
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
        <LoadingStateAnimation />
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
                className="w-full p-4 border-b border-gray-700 bg-gray-900 text-gray-200"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-base font-semibold">
                      {notification.friendInfo.name} ({notification.friendInfo.email})
                    </div>
                    <p className="text-xs text-gray-400">
                      {notification.status === "pending" ? "Sent request" : "Became friends"} on {new Date(notification.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {/* Loader reference element */}
          <div ref={loaderRef} className="h-10 flex justify-center items-center">
            {!isReachingEnd && isLoadingMore && <LoadingStateAnimation />}
          </div>
        </div>
      )}
    </div>
  );
};

export default Notifications;