"use client";

import { authClient } from '@/lib/auth-client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { UserPlus, Search, X, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import Image from 'next/image';
import { createPortal } from 'react-dom';
import { useToast } from '@/app/hooks/use-toast';

// Improved DropdownPortal component with better positioning and accessibility
interface DropdownPortalProps {
  children: React.ReactNode;
  anchorRef: React.RefObject<HTMLElement | null>;
  isOpen: boolean;
  onClose: () => void;
}

export const DropdownPortal = ({ children, anchorRef, isOpen, onClose }: DropdownPortalProps) => {
  const [mounted, setMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
  });

  // Update position based on anchor element
  const updatePosition = useCallback(() => {
    if (anchorRef.current instanceof HTMLElement) {
      const rect = anchorRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  }, [anchorRef]);

  // Mount component 
  useEffect(() => {
    setMounted(true);
  }, []);

  // Update position on mount and resize
  useEffect(() => {
    if (isOpen) {
      updatePosition();
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition);
    }
    
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
    };
  }, [isOpen, updatePosition]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(e.target as Node) &&
        anchorRef.current instanceof HTMLElement && 
        !anchorRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose, anchorRef]);

  if (!mounted || !isOpen) return null;
  
  return createPortal(
    <div 
      ref={dropdownRef}
      style={{
        position: 'absolute',
        top: position.top,
        left: position.left,
        width: position.width,
        zIndex: 50,
      }}
      role="dialog"
      aria-modal="true"
    >
      {children}
    </div>,
    document.body
  );
};

// Define user type for better type safety
interface User {
  id: string;
  email: string;
  name?: string;
  image?: string;
}

// Component to render user avatar with fallback
const UserAvatar = ({ user, size = 8 }: { user: User; size?: number }) => {
  const sizeClass = `w-${size} h-${size}`;
  
  return (
    <div className={`${sizeClass} rounded-full overflow-hidden bg-gray-600 flex items-center justify-center`}>
      {user.image ? (
        <Image
          src={user.image}
          alt={user.name || user.email}
          width={size * 4}
          height={size * 4}
          className="object-cover"
          priority
        />
      ) : (
        <span className="text-xs font-bold text-gray-100">
          {(user.name || user.email).charAt(0).toUpperCase()}
        </span>
      )}
    </div>
  );
};

export const AddFriendCard = () => {
  const { data: session } = authClient.useSession();
  const { toast } = useToast();
  const user = session?.user;

  const [friendEmail, setFriendEmail] = useState('');
  const [friendError, setFriendError] = useState('');
  const [friendSuccess, setFriendSuccess] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [currentFocusIndex, setCurrentFocusIndex] = useState(-1);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchResultsRef = useRef<HTMLUListElement>(null);

  // Focus input on component mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Close dropdown handler
  const closeDropdown = useCallback(() => {
    setIsDropdownOpen(false);
    setCurrentFocusIndex(-1);
  }, []);

  // Improved keyboard navigation for search results
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isDropdownOpen || !searchResults.length) return;

      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          closeDropdown();
          break;
        case 'ArrowDown':
          e.preventDefault();
          setCurrentFocusIndex(prev =>
            prev < searchResults.length - 1 ? prev + 1 : 0 // Loop back to start
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setCurrentFocusIndex(prev => 
            prev > 0 ? prev - 1 : searchResults.length - 1 // Loop to end
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (currentFocusIndex >= 0 && currentFocusIndex < searchResults.length) {
            selectUser(searchResults[currentFocusIndex]);
          } else if (selectedUser) {
            handleAddFriend();
          }
          break;
        case 'Tab':
          // Let Tab work normally but close dropdown
          closeDropdown();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [searchResults, currentFocusIndex, selectedUser, isDropdownOpen, closeDropdown]);

  // Scroll to focused item
  useEffect(() => {
    if (currentFocusIndex >= 0 && searchResultsRef.current) {
      const element = searchResultsRef.current.children[currentFocusIndex] as HTMLElement;
      if (element) {
        element.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [currentFocusIndex]);

  // Live-search with debounce
  useEffect(() => {
    setFriendError('');
    setFriendSuccess('');

    if (!friendEmail.trim()) {
      setSearchResults([]);
      closeDropdown();
      return;
    }

    setIsLoading(true);
    const handler = setTimeout(async () => {
      try {
        const res = await fetch(`/api/user/search?email=${encodeURIComponent(friendEmail)}`);
        if (!res.ok) throw new Error(res.statusText);

        const { users } = await res.json();

        // Filter out current user from results
        const filteredUsers = users?.filter((u: User) => u.id !== user?.id) || [];
        setSearchResults(filteredUsers);
        
        if (filteredUsers.length > 0) {
          setIsDropdownOpen(true);
          setCurrentFocusIndex(0);
        } else {
          closeDropdown();
        }
      } catch (error) {
        console.error("Search error:", error);
        setSearchResults([]);
        closeDropdown();
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      clearTimeout(handler);
      setIsLoading(false);
    };
  }, [friendEmail, user?.id, closeDropdown]);

  const selectUser = (user: User) => {
    setFriendEmail(user.email);
    setSelectedUser(user);
    closeDropdown();

    // Refocus input after selection
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const clearInput = () => {
    setFriendEmail('');
    setSelectedUser(null);
    setSearchResults([]);
    setFriendError('');
    setFriendSuccess('');
    closeDropdown();

    // Refocus input after clearing
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleAddFriend = async () => {
    if (!user || !friendEmail.trim()) {
      setFriendError('Please enter a valid email address');
      return;
    }

    // Don't allow adding yourself
    if (friendEmail.toLowerCase() === user.email?.toLowerCase()) {
      setFriendError("You can't add yourself as a friend");
      return;
    }

    setIsSubmitting(true);
    setFriendError('');

    try {
      const res = await fetch('/api/user/add-friend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: friendEmail }),
      });

      const data = await res.json();

      if (data.success) {
        setFriendSuccess('Friend request sent successfully!');
        toast({ title: 'Friend Request Sent', description: 'Your friend request has been sent.' });
        setFriendEmail('');
        setSelectedUser(null);
      } else {
        setFriendError(data.error || 'Failed to add friend. Please try again.');
      }
    } catch (error) {
      console.error("Add friend error:", error);
      setFriendError('Failed to add friend. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-white/10 w-full transition-all">
      <div className=" rounded-xl p-4" ref={wrapperRef}>
        <div className="flex flex-col gap-4">


          {/* Search input */}
          <div className="relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>

            <input
              ref={inputRef}
              type="email"
              autoComplete="off"
              value={friendEmail}
              onChange={(e) => setFriendEmail(e.target.value)}
              placeholder="Search by email address..."
              className="w-full pl-10 pr-10 py-3 rounded-lg bg-gray-700/50 text-white border border-gray-600/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-400"
              aria-label="Friend email"
              aria-invalid={!!friendError}
              aria-describedby={friendError ? "friend-error" : friendSuccess ? "friend-success" : undefined}
              aria-expanded={isDropdownOpen}
              aria-controls={isDropdownOpen ? "search-results-list" : undefined}
              aria-owns={isDropdownOpen ? "search-results-list" : undefined}
              aria-activedescendant={currentFocusIndex >= 0 ? `search-result-${currentFocusIndex}` : undefined}
              role="combobox"
              aria-autocomplete="list"
            />

            {isLoading && (
              <div className="absolute inset-y-0 right-3 flex items-center">
                <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />
              </div>
            )}

            {friendEmail && !isLoading && (
              <button
                onClick={clearInput}
                className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-white transition-colors"
                aria-label="Clear input"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Search results dropdown */}
          <DropdownPortal 
            anchorRef={inputRef} 
            isOpen={isDropdownOpen} 
            onClose={closeDropdown}
          >
            <ul
              id="search-results-list"
              ref={searchResultsRef}
              className="w-full bg-gray-700/90 backdrop-blur-sm border border-gray-600/50 rounded-lg max-h-64 overflow-y-auto text-white shadow-xl"
              role="listbox"
              aria-label="Search results"
            >
              {searchResults.map((user, index) => (
                <li
                  key={user.id}
                  id={`search-result-${index}`}
                  onClick={() => selectUser(user)}
                  className={`p-3 cursor-pointer transition-colors flex items-center gap-3 ${
                    index === currentFocusIndex ? 'bg-blue-600/70' : 'hover:bg-blue-600/40'
                  }`}
                  role="option"
                  aria-selected={index === currentFocusIndex}
                  tabIndex={-1}
                >
                  <UserAvatar user={user} />
                  <div className="flex-1 min-w-0">
                    {user.name && <div className="font-medium truncate">{user.name}</div>}
                    <div className={`text-sm truncate ${user.name ? 'text-gray-300' : ''}`}>
                      {user.email}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </DropdownPortal>

          {/* Action button */}
          <button
            onClick={handleAddFriend}
            disabled={isSubmitting || !friendEmail.trim()}
            className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-gray-800"
            aria-busy={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Sending...</span>
              </>
            ) : (
              <>
                <UserPlus className="h-5 w-5" />
                <span>Send Friend Request</span>
              </>
            )}
          </button>

          {/* Status messages */}
          {friendError && (
            <div
              id="friend-error"
              className="text-red-400 text-sm mt-1 px-2 flex items-center gap-2"
              role="alert"
            >
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{friendError}</span>
            </div>
          )}

          {friendSuccess && (
            <div
              id="friend-success"
              className="text-green-400 text-sm mt-1 px-2 flex items-center gap-2"
              role="status"
            >
              <CheckCircle className="h-4 w-4 flex-shrink-0" />
              <span>{friendSuccess}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddFriendCard;