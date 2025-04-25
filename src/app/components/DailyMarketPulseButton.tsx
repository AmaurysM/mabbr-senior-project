"use client";

import React, { useState, useEffect, useRef } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/solid';
import DailyMarketVotePanel from './DailyMarketVotePanel';

const DailyMarketPulseButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Toggle the drawer open/closed
  const toggleDrawer = () => {
    setIsOpen(prevState => !prevState);
  };

  // Handle vote submission
  const handleVoteSubmit = () => {
    setHasVoted(true);
    setIsOpen(false); // Auto close panel on submission
  };

  // Close overlay when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // If click is not on the button and not inside the overlay
      if (
        overlayRef.current && 
        !overlayRef.current.contains(event.target as Node) &&
        buttonRef.current && 
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close overlay when pressing escape key
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
    } else {
      document.removeEventListener('keydown', handleEscKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen]);

  // Check if user has already voted
  useEffect(() => {
    const checkVoteStatus = async () => {
      try {
        const response = await fetch('/api/market-sentiment/vote', {
          credentials: 'include',
        });
        
        if (response.ok) {
          const data = await response.json();
          setHasVoted(data.hasVoted);
        }
      } catch (error) {
        console.error('Error checking vote status:', error);
      }
    };

    checkVoteStatus();
  }, []);

  return (
    <div className="relative flex justify-center w-full">
      <button
        ref={buttonRef}
        onClick={toggleDrawer}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`${hasVoted ? 'bg-transparent border border-black/40' : 'gold-shimmer'} flex items-center justify-center px-4 py-1 rounded-b-lg ${hasVoted ? '' : 'shadow-md'} transition-all duration-200 focus:outline-none ${isOpen ? '' : (!hasVoted && 'animate-jiggle')}`}
        aria-label="Open Daily Market Pulse"
      >
        <ChevronDownIcon className={`h-5 w-5 ${hasVoted ? 'text-black/70' : 'text-yellow-900'} transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {showTooltip && !isOpen && !hasVoted && (
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-black text-white text-sm rounded whitespace-nowrap z-50">
          Daily Login Tokens Available!
        </div>
      )}

      {isOpen && (
        <div className="fixed inset-x-0 top-16 z-[100] flex justify-center animate-slideDown px-4">
          <div 
            ref={overlayRef}
            className="w-full max-w-5xl bg-gray-900/95 backdrop-blur-md shadow-2xl rounded-xl"
          >
            <div className="p-2">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-bold text-white ml-3">Daily Market Pulse</h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-white p-2"
                >
                  ✕
                </button>
              </div>
              <div className={`${hasVoted ? 'bg-blue-500/20 border border-blue-500/40' : 'bg-yellow-400/20'} rounded-lg p-3 mb-4`}>
                <p className={`${hasVoted ? 'text-blue-300' : 'text-yellow-300'} font-medium text-center`}>
                  {hasVoted ? "Daily Tokens Claimed" : "Submit to claim your free daily token!"}
                </p>
              </div>
            </div>
            <DailyMarketVotePanel isOverlay={true} showTokenMessage={false} onVoteSubmit={handleVoteSubmit} />
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyMarketPulseButton; 