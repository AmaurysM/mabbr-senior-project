"use client";

import React, { Suspense, useState, useEffect, lazy } from "react";
import { ScratchTicket } from "@/app/components/ScratchTicketTile";
import ScratchTicketShop from "./shop/ScratchTicketShop";
import UserTicketsList from "./user-tickets/UserTicketsList";
import LoadingStateAnimation from "@/app/components/LoadingState";
import { useToast } from "@/app/hooks/use-toast";
import { authClient } from "@/lib/auth-client";
import { IoTicket } from "react-icons/io5";
import { UserScratchTicket } from "@/app/components/OwnedScratchTicket";

// Define ScratchTicketType (same as in other files)
type ScratchTicketType = 'tokens' | 'money' | 'stocks' | 'random' | 'diamond';

// Generate a simple UUID
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Create a seeded random number generator based on the date for consistent shop across users
function createSeededRandom(seed: number) {
  return function() {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  };
}

// Generate a daily shop of tickets with randomized rarities
const generateDailyShop = (): ScratchTicket[] => {
  console.log('Generating local daily shop');
  
  // Create a daily seed based on the current date for consistent shop across users
  const now = new Date();
  const seed = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
  const seededRandom = createSeededRandom(seed);
  
  // Define all possible ticket types with proper probabilities
  const ticketTypes = [
    {
      type: "tokens" as const,
      name: "Golden Fortune",
      price: 25,
      description: "Win tokens! Try your luck with this golden ticket.",
      chance: 24.75,
    },
    {
      type: "money" as const,
      name: "Cash Splash",
      price: 50,
      description: "Win cash! This green ticket could turn into real money.",
      chance: 24.75,
    },
    {
      type: "stocks" as const,
      name: "Stock Surge",
      price: 75, 
      description: "Win shares! Get a piece of the market with this blue ticket.",
      chance: 24.75,
    },
    {
      type: "random" as const,
      name: "Mystic Chance",
      price: 100,
      description: "Win anything with a 10x multiplier! High risk but incredible rewards if you hit!",
      chance: 24.75,
    },
    {
      type: "diamond" as const,
      name: "Diamond Scratch",
      price: 200,
      description: "ULTRA RARE - 1% CHANCE TO APPEAR! Win anything with a 50x multiplier!",
      chance: 1.0, // Explicitly set to 1.0% chance
    }
  ];
  
  // Verify that probabilities sum to 100%
  const totalChance = ticketTypes.reduce((sum, type) => sum + type.chance, 0);
  console.log(`Total chance: ${totalChance}%`); // Should be 100%
  
  // IMPORTANT: Hard-code shop size to ensure consistency between environments
  const TOTAL_SHOP_SLOTS = 12; // Always generate exactly 12 tickets
  console.log(`Creating shop with ${TOTAL_SHOP_SLOTS} tickets`);
  
  const shopTickets: ScratchTicket[] = [];
  
  // Create a function to select a random ticket type based on weighted chances
  const selectRandomTicketType = () => {
    const rand = seededRandom() * 100;
    let cumulativeChance = 0;
    
    for (const ticketType of ticketTypes) {
      cumulativeChance += ticketType.chance;
      if (rand <= cumulativeChance) {
        return ticketType;
      }
    }
    
    // Fallback to first ticket type
    return ticketTypes[0];
  };
  
  // Fill the shop with random tickets
  for (let i = 0; i < TOTAL_SHOP_SLOTS; i++) {
    const selectedTicketType = selectRandomTicketType();
    
    // Determine if this is a bonus ticket (25% chance)
    const isBonus = seededRandom() < 0.25;
    
    // Important: For bonus tickets, use the same description as the regular version
    // but add the bonus indicator
    const bonusDescription = isBonus 
      ? selectedTicketType.description
      : selectedTicketType.description;
    
    // Generate deterministic ID (same logic as API)
    const dayKey = getDayKey();
    const deterministicId = `${dayKey}-${selectedTicketType.type}${isBonus ? '-bonus' : ''}-${i}`;
    
    // Create a new ticket object that matches the ScratchTicket interface
    shopTickets.push({
      id: deterministicId,
      name: selectedTicketType.name,
      price: selectedTicketType.price,
      type: selectedTicketType.type,
      description: isBonus ? bonusDescription : selectedTicketType.description,
      createdAt: new Date(),
      isBonus,
      dayKey
    });
  }
  
  // Verify the length of the shop
  console.log(`Generated ${shopTickets.length} tickets`);
  
  // Log the distribution of tickets for verification
  const distribution = shopTickets.reduce((acc: any, ticket) => {
    acc[ticket.type] = (acc[ticket.type] || 0) + 1;
    return acc;
  }, {});
  
  console.log('Daily shop distribution:', distribution);
  console.log('Bonus tickets:', shopTickets.filter(t => t.isBonus).length);
  
  // Ensure the shop has EXACTLY the right number of tickets
  if (shopTickets.length !== TOTAL_SHOP_SLOTS) {
    console.warn(`Wrong number of tickets: ${shopTickets.length}, fixing...`);
    
    // If we have too many, remove extras
    if (shopTickets.length > TOTAL_SHOP_SLOTS) {
      shopTickets.splice(TOTAL_SHOP_SLOTS);
    }
    
    // If we have too few, add more of the default token tickets
    while (shopTickets.length < TOTAL_SHOP_SLOTS) {
      const i = shopTickets.length; // Index for deterministic ID
      const dayKey = getDayKey();
      const deterministicId = `${dayKey}-tokens-fallback-${i}`;
      
      shopTickets.push({
        id: deterministicId,
        name: "Golden Fortune",
        price: 25,
        type: "tokens",
        description: "Win tokens! Try your luck with this golden ticket.",
        createdAt: new Date(),
        isBonus: false,
        dayKey
      });
    }
    
    console.log(`Fixed shop size: ${shopTickets.length}`);
  }
  
  return shopTickets;
};

// Function to get the day key for storing daily shop
const getDayKey = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function ScratchOffs() {
  const { toast } = useToast();
  const { data: session } = authClient.useSession();

  const [shopTickets, setShopTickets] = useState<ScratchTicket[]>([]);
  const [purchasedTickets, setPurchasedTickets] = useState<UserScratchTicket[]>([]);
  const [userTokens, setUserTokens] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper: fetch purchased tickets from API
  const fetchUserTickets = async (): Promise<UserScratchTicket[]> => {
    if (!session?.user) return [];
    try {
      // Fetch all of the user's tickets (scratched and unscratched) without
      // restricting by dayKey.  We will work out which tickets belong to the
      // current shop locally.  This avoids problems caused by client ↔ server
      // timezone differences that resulted in the purchased overlay not
      // appearing even though the backend correctly recorded the purchase.
      const res = await fetch(`/api/users/scratch-tickets?includeScratched=true`, { credentials: 'include' });
      if (!res.ok) throw new Error(`Error fetching tickets: ${res.status}`);
      const data = await res.json();
      return Array.isArray(data.tickets) ? data.tickets as UserScratchTicket[] : [];
    } catch (err) {
      console.error('fetchUserTickets error', err);
      return [];
    }
  };

  // Helper: fetch token balance from API
  const fetchTokens = async (): Promise<number> => {
    if (!session?.user) return 0;
    try {
      const res = await fetch('/api/user', { credentials: 'include' });
      if (!res.ok) throw new Error('Error fetching tokens');
      const data = await res.json();
      return data.tokenCount ?? 0;
    } catch (err) {
      console.error('fetchTokens error', err);
      return 0;
    }
  };

  // Reload both tickets, tokens, and regenerate shop
  const reloadData = async () => {
    if (!session?.user) return;
    setError(null);
    setIsLoading(true);
    try {
      const [tickets, tokens] = await Promise.all([fetchUserTickets(), fetchTokens()]);
      setPurchasedTickets(tickets);
      setUserTokens(tokens);
      const shop = generateDailyShop();
      const updated = shop.map(s => ({
        ...s,
        purchased: tickets.some(t => t.shopTicketId === s.id)
      }));
      setShopTickets(updated);
    } catch (err) {
      console.error('reloadData error', err);
      setError('Failed to load scratch tickets');
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load + daily reset
  useEffect(() => {
    if (session?.user) {
      reloadData();
      const key = 'shop-day-key';
      localStorage.setItem(key, getDayKey());
      const interval = setInterval(() => {
        const stored = localStorage.getItem(key);
        const today = getDayKey();
        if (stored !== today) {
          localStorage.setItem(key, today);
          reloadData();
        }
      }, 60000);
      return () => clearInterval(interval);
    }
  }, [session?.user]);

  // Cross-tab sync
  useEffect(() => {
    if (!session?.user) return;
    const handler = () => reloadData();
    window.addEventListener('tickets-updated', handler);
    window.addEventListener('storage', e => { if (e.key === 'tickets-updated') handler(); });
    return () => {
      window.removeEventListener('tickets-updated', handler);
      window.removeEventListener('storage', handler);
    };
  }, [session?.user]);

  // Super secret key combo to reset daily ticket purchases (Konami Code)
  useEffect(() => {
    if (!session?.user) return;
    const secretCombo = [
      "ArrowUp","ArrowUp","ArrowDown","ArrowDown",
      "ArrowLeft","ArrowRight","ArrowLeft","ArrowRight",
      "b","a"
    ];
    let comboIndex = 0;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === secretCombo[comboIndex]) {
        comboIndex++;
        if (comboIndex === secretCombo.length) {
          comboIndex = 0;
          fetch("/api/users/scratch-tickets/reset-daily", {
            method: "POST",
            credentials: "include"
          })
            .then(res => {
              if (res.ok) {
                reloadData();
                toast({ title: "Secret Mode Activated", description: "Daily purchases reset!" });
              }
            })
            .catch(err => console.error("Error resetting purchases:", err));
        }
      } else {
        comboIndex = 0;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [session?.user]);

  // Purchase handler
  const handlePurchase = async (ticket: ScratchTicket) => {
    if (isLoading || !session?.user) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/users/scratch-tickets?id=${ticket.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          price: ticket.price,
          type: ticket.type,
          name: ticket.name,
          isBonus: ticket.isBonus,
          shopTicketId: ticket.id,
          dayKey: getDayKey()
        })
      });
      if (!res.ok) throw new Error(`Purchase failed: ${res.status}`);
      await reloadData();
      // Fetch latest token count for global update
      let updatedTokens = 0;
      try {
        const userRes = await fetch('/api/user', { credentials: 'include' });
        if (userRes.ok) {
          const userData = await userRes.json();
          updatedTokens = userData.tokenCount || 0;
        }
      } catch (err) {
        console.error('Error fetching updated token count:', err);
      }
      // Dispatch global token update events
      window.dispatchEvent(new CustomEvent('token-balance-updated', { detail: { newBalance: updatedTokens } }));
      window.localStorage.setItem('token-balance-updated', Date.now().toString());
      window.dispatchEvent(new StorageEvent('storage', { key: 'token-refresh', newValue: Date.now().toString() }));
      window.dispatchEvent(new StorageEvent('storage', { key: `user-${session?.user?.id}-tokens`, newValue: updatedTokens.toString() }));
      // Tickets updated events
      window.dispatchEvent(new CustomEvent('tickets-updated'));
      localStorage.setItem('tickets-updated', Date.now().toString());
      toast({ title: 'Purchase Successful', description: `You bought a ${ticket.name} ticket!` });
    } catch (err: any) {
      console.error('handlePurchase error', err);
      toast({ title: 'Purchase Failed', description: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  if (error) {
    return (
      <div className="max-w-screen-lg mx-auto p-8 text-center text-white">
        <p>{error}</p>
        <button onClick={reloadData} className="mt-4 px-4 py-2 bg-blue-500 rounded">Retry</button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-screen-2xl mx-auto px-4">
      <h1 className="text-3xl font-bold text-white">Scratch Offs</h1>
      <UserTicketsList purchasedTickets={purchasedTickets} />
      <ScratchTicketShop
        tickets={shopTickets}
        title="Daily Shop"
        subtitle="New tickets available every day."
        onPurchase={handlePurchase}
        isLoading={isLoading}
      />
    </div>
  );
} 