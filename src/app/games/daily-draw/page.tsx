"use client";

import React, { useEffect, useState } from "react";
import { FaHourglassHalf, FaCoins, FaTrophy, FaUsers } from "react-icons/fa";
import { authClient } from "@/lib/auth-client";
import { toast } from "react-hot-toast";

interface Participant {
  id: string;
  username: string;
  tokens: number;
}

interface PreviousWinner {
  username: string;
  tokens: number;
  date: string;
}

interface LeaderboardUser {
  id: string;
  name: string;
  email: string;
  image: string | null;
  tokens: number;
}

export default function DailyDraw() {
  const [timeRemaining, setTimeRemaining] = useState<string>("");
  const [tokenInput, setTokenInput] = useState<string>("");
  const [totalPot, setTotalPot] = useState<number>(0);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [previousWinners, setPreviousWinners] = useState<PreviousWinner[]>([]);
  const [userTokens, setUserTokens] = useState<number>(0);
  const [userEntry, setUserEntry] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: session } = authClient.useSession();
  const user = session?.user;
  
  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        
        // Fetch user's token balance and current pot
        const [leaderboardRes, potRes] = await Promise.all([
          fetch("/api/user/token-leaderboard", { 
            credentials: "include",
            headers: { 'Content-Type': 'application/json' }
          }),
          fetch("/api/games/daily-draw/pot", { 
            credentials: "include",
            headers: { 'Content-Type': 'application/json' }
          })
        ]);

        if (!leaderboardRes.ok) {
          console.error("Error fetching token leaderboard:", await leaderboardRes.text());
          throw new Error("Failed to fetch token balance");
        }

        const leaderboardData = await leaderboardRes.json();
        const currentUser = leaderboardData.users.find((u: LeaderboardUser) => u.id === user.id);
        
        if (currentUser) {
          setUserTokens(currentUser.tokens);
        }

        if (potRes.ok) {
          const potData = await potRes.json();
          setTotalPot(potData.totalPot);
          setParticipants(potData.participants);
          const userEntry = potData.participants.find((p: Participant) => p.id === user.id);
          if (userEntry) {
            setUserEntry(userEntry.tokens);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load game data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

  useEffect(() => {
    const updateTimeRemaining = () => {
      const now = new Date();
      const drawTime = new Date(now);
      drawTime.setHours(21, 30, 0, 0); // 9:30 PM
      
      if (now > drawTime) {
        drawTime.setDate(drawTime.getDate() + 1);
      }
      
      const diffMs = drawTime.getTime() - now.getTime();
      const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const diffSecs = Math.floor((diffMs % (1000 * 60)) / 1000);
      
      setTimeRemaining(`${diffHrs.toString().padStart(2, '0')}:${diffMins.toString().padStart(2, '0')}:${diffSecs.toString().padStart(2, '0')}`);
    };
    
    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 1000);
    
    return () => clearInterval(interval);
  }, []);

  const handleTokenSubmit = async () => {
    const tokens = parseInt(tokenInput);
    if (isNaN(tokens) || tokens <= 0) {
      toast.error("Please enter a valid number of tokens");
      return;
    }
    if (tokens > userTokens) {
      toast.error("Not enough tokens in your wallet");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch('/api/games/daily-draw/enter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ tokens })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || error.error || 'Failed to enter the draw');
      }

      const data = await response.json();

      // Update state with the response data
      setUserTokens(data.userTokens);
      setTotalPot(data.totalPot);
      setUserEntry(prev => prev + tokens);
      setTokenInput("");

      // Add or update participant
      const existingParticipantIndex = participants.findIndex(p => p.id === user?.id);
      if (existingParticipantIndex !== -1) {
        const updatedParticipants = [...participants];
        updatedParticipants[existingParticipantIndex].tokens += tokens;
        setParticipants(updatedParticipants);
      } else {
        setParticipants(prev => [...prev, {
          id: user?.id || "",
          username: user?.name || "Anonymous",
          tokens: tokens
        }]);
      }

      // Trigger token refresh across components
      if (user?.id) {
        // Update localStorage with the new token amount
        localStorage.setItem(`user-${user.id}-tokens`, data.userTokens.toString());
        // Dispatch custom event with new balance
        window.dispatchEvent(new CustomEvent('token-balance-updated', { detail: { newBalance: data.userTokens } }));
        // Also update a key for storage listeners
        window.localStorage.setItem('token-balance-updated', Date.now().toString());
        // Dispatch storage events
        window.dispatchEvent(new StorageEvent('storage', { key: 'token-refresh', newValue: Date.now().toString() }));
        window.dispatchEvent(new StorageEvent('storage', { key: `user-${user.id}-tokens`, newValue: data.userTokens.toString() }));
      }

      toast.success(`Added ${tokens} tokens to the pot!`);
    } catch (error) {
      console.error('Error entering draw:', error);
      toast.error(error instanceof Error ? error.message : "Failed to enter the draw");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh]">
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/10 text-center max-w-md w-full">
          <h2 className="text-2xl font-bold text-white mb-4">Join the Daily Draw</h2>
          <p className="text-gray-400 mb-6">Login to participate in the daily token draw and win big!</p>
          <button
            onClick={() => window.location.href = '/login-signup'}
            className="px-6 py-3 bg-blue-600 rounded-xl text-white font-medium hover:bg-blue-700 transition-colors w-full"
          >
            Login to Participate
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto px-4">
      <h1 className="text-3xl font-bold text-white mb-2">Daily Draw</h1>
      <p className="text-gray-400 mb-8">Enter tokens for a chance to win the entire pot! Drawing happens daily at 9:30 PM.</p>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Draw Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Current Pot</h2>
                <div className="flex items-center text-3xl font-bold text-yellow-500">
                  <FaCoins className="mr-2" />
                  {totalPot.toLocaleString()} Tokens
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Time Remaining</h2>
                <div className="text-2xl font-mono text-white bg-gray-900 px-4 py-2 rounded-lg">
                  {timeRemaining}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <input
                  type="number"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  placeholder="Enter tokens"
                  disabled={isSubmitting}
                  className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleTokenSubmit}
                  disabled={isSubmitting}
                  className={`bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-colors ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isSubmitting ? 'Entering...' : 'Enter Draw'}
                </button>
              </div>
              
              <div className="flex items-center justify-between bg-gray-900 rounded-lg p-4">
                <div>
                  <p className="text-gray-400">Your Wallet</p>
                  <p className="text-white font-bold">{userTokens.toLocaleString()} Tokens</p>
                </div>
                <div>
                  <p className="text-gray-400">Your Entry</p>
                  <p className="text-white font-bold">{userEntry.toLocaleString()} Tokens</p>
                </div>
                <div>
                  <p className="text-gray-400">Win Chance</p>
                  <p className="text-white font-bold">
                    {totalPot > 0 ? ((userEntry / totalPot) * 100).toFixed(1) : "0"}%
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Participants List */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <div className="flex items-center mb-4">
              <FaUsers className="text-blue-500 mr-2" />
              <h2 className="text-xl font-bold text-white">Current Participants</h2>
            </div>
            <div className="space-y-3">
              {participants.map((participant, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-900 rounded-lg p-3">
                  <span className="text-white">{participant.username}</span>
                  <span className="text-yellow-500 font-bold">{participant.tokens.toLocaleString()} Tokens</span>
                </div>
              ))}
              {participants.length === 0 && (
                <p className="text-gray-400 text-center py-4">Be the first to enter the draw!</p>
              )}
            </div>
          </div>
        </div>

        {/* Previous Winners */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <div className="flex items-center mb-4">
            <FaTrophy className="text-yellow-500 mr-2" />
            <h2 className="text-xl font-bold text-white">Previous Winners</h2>
          </div>
          <div className="space-y-3">
            {previousWinners.map((winner, index) => (
              <div key={index} className="bg-gray-900 rounded-lg p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-white font-bold">{winner.username}</span>
                  <span className="text-yellow-500">{winner.tokens.toLocaleString()} Tokens</span>
                </div>
                <div className="text-gray-400 text-sm">{winner.date}</div>
              </div>
            ))}
            {previousWinners.length === 0 && (
              <p className="text-gray-400 text-center py-4">No previous winners yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 