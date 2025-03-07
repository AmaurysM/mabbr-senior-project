import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';

interface FriendRequest {
  id: string;
  requester: {
    id: string;
    name: string | null;
    email: string;
  };
  timestamp: string;
}

interface NotificationDropdownProps {
  requests: FriendRequest[];
  loading: boolean;
  handleAcceptRequest: (requestId: string) => Promise<void>;
  handleRejectRequest: (requestId: string) => Promise<void>;
  onClose: () => void;
}

// Create a separate component for the dropdown
const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ 
  requests, 
  loading, 
  handleAcceptRequest, 
  handleRejectRequest, 
  onClose 
}) => {
  if (!requests || requests.length === 0 && !loading) {
    return (
      <div className="p-4 text-center text-gray-400">
        No new notifications
      </div>
    );
  }

  return (
    <div className="max-h-96 overflow-y-auto">
      {loading ? (
        <div className="p-4 text-center text-gray-400">
          Loading notifications...
        </div>
      ) : (
        <div className="divide-y divide-gray-700/50">
          {requests.map((request) => (
            <div key={request.id} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">
                    {request.requester.name || request.requester.email}
                  </p>
                  <p className="text-xs text-gray-400">
                    wants to follow your trading activity
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleAcceptRequest(request.id)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded-lg text-sm transition-colors"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleRejectRequest(request.id)}
                    className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded-lg text-sm transition-colors"
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
  );
};

const NotificationBell: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const bellRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);
    
    return () => {
      setMounted(false);
    };
  }, []);
  
  // Fetch friend requests
  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/user/friend-requests');
      const data = await response.json();
      
      if (data.success) {
        setRequests(data.requests || []);
      } else {
        console.error('Failed to fetch friend requests');
        setRequests([]);
      }
    } catch (error) {
      console.error('Error fetching friend requests:', error);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch requests initially
    fetchRequests();
    
    // Set up interval to refresh every minute
    const intervalId = setInterval(fetchRequests, 60000);
    
    return () => clearInterval(intervalId);
  }, []);

  // Handle click outside to close dropdown
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleAcceptRequest = async (requestId: string) => {
    try {
      const response = await fetch('/api/user/accept-friend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requestId }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Remove the request from the list
        setRequests(prev => prev.filter(req => req.id !== requestId));
        // Show success message
        toast.success(data.message || 'Friend request accepted');
        // Refresh the transactions list by reloading the page
        window.location.reload();
      } else {
        console.error('Failed to accept friend request');
        toast.error(data.error || 'Failed to accept friend request');
      }
    } catch (error) {
      console.error('Error accepting friend request:', error);
      toast.error('Failed to accept friend request');
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      const response = await fetch('/api/user/reject-friend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requestId }),
      });
      
      if (response.ok) {
        // Remove the request from the list
        setRequests(prev => prev.filter(req => req.id !== requestId));
        toast.success('Friend request rejected');
      } else {
        console.error('Failed to reject friend request');
        toast.error('Failed to reject friend request');
      }
    } catch (error) {
      console.error('Error rejecting friend request:', error);
      toast.error('Failed to reject friend request');
    }
  };

  return (
    <>
      <button
        ref={bellRef}
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

      {mounted && isOpen && createPortal(
        <div className="fixed inset-0 z-[9999] bg-transparent pointer-events-none">
          <div 
            className="fixed top-16 right-4 w-80 bg-gray-800 rounded-xl shadow-xl border border-gray-700/50 overflow-hidden pointer-events-auto"
            style={{ zIndex: 99999 }}
          >
            <div className="p-4 border-b border-gray-700/50">
              <h3 className="text-lg font-semibold text-white">Notifications</h3>
            </div>
            <NotificationDropdown 
              requests={requests}
              loading={loading}
              handleAcceptRequest={handleAcceptRequest}
              handleRejectRequest={handleRejectRequest}
              onClose={() => setIsOpen(false)}
            />
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default NotificationBell; 