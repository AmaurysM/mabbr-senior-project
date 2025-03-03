import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface FriendRequest {
  id: string;
  requester: {
    id: string;
    name: string | null;
    email: string;
  };
  timestamp: string;
}

const NotificationBell: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Add portal container state
  const [mounted, setMounted] = useState(false);

  // Fetch friend requests
  const fetchRequests = async () => {
    try {
      const res = await fetch('/api/user/friend-requests');
      const data = await res.json();
      
      if (data.success) {
        setRequests(data.requests);
      }
    } catch (error) {
      console.error('Error fetching friend requests:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    // Poll for new requests every minute
    const intervalId = setInterval(fetchRequests, 60000);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAcceptRequest = async (requestId: string) => {
    try {
      const res = await fetch('/api/user/accept-friend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId })
      });
      
      if (res.ok) {
        // Remove the accepted request from the list
        setRequests(prev => prev.filter(req => req.id !== requestId));
      }
    } catch (error) {
      console.error('Error accepting friend request:', error);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      const res = await fetch('/api/user/reject-friend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId })
      });
      
      if (res.ok) {
        // Remove the rejected request from the list
        setRequests(prev => prev.filter(req => req.id !== requestId));
      }
    } catch (error) {
      console.error('Error rejecting friend request:', error);
    }
  };

  const notificationDropdown = isOpen && (
    <div 
      className="fixed inset-0 z-[99999] pointer-events-none"
      style={{ backgroundColor: 'transparent' }}
    >
      <div 
        className="absolute right-4 top-16 w-80 bg-gray-800 rounded-xl shadow-xl border border-gray-700/50 overflow-hidden pointer-events-auto"
      >
        <div className="p-4 border-b border-gray-700/50">
          <h3 className="text-lg font-semibold text-white">Notifications</h3>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-gray-400">
              Loading notifications...
            </div>
          ) : requests.length === 0 ? (
            <div className="p-4 text-center text-gray-400">
              No new notifications
            </div>
          ) : (
            <div className="divide-y divide-gray-700/50">
              {requests.map(request => (
                <div key={request.id} className="p-4 hover:bg-gray-700/30 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white">
                        <span className="font-semibold">
                          {request.requester.name || request.requester.email.split('@')[0]}
                        </span>
                        {' wants to be your friend'}
                      </p>
                      <p className="text-sm text-gray-400">
                        {new Date(request.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleAcceptRequest(request.id)}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-500 transition-colors"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleRejectRequest(request.id)}
                        className="px-3 py-1 bg-gray-700 text-gray-300 text-sm rounded-lg hover:bg-gray-600 transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-400 hover:text-white transition-colors"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {requests.length > 0 && (
          <span className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
            {requests.length}
          </span>
        )}
      </button>
      {mounted && createPortal(notificationDropdown, document.body)}
    </>
  );
};

export default NotificationBell; 