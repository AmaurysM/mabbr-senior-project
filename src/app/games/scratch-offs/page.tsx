"use client";

import React, { Suspense, useState, useEffect } from "react";
import { ScratchTicket } from "@/app/components/ScratchTicketTile";
import ScratchTicketShop from "./shop/ScratchTicketShop";
import UserTicketsList from "./user-tickets/UserTicketsList";
import LoadingStateAnimation from "@/app/components/LoadingState";
import { useToast } from "@/app/hooks/use-toast";
import { authClient } from "@/lib/auth-client";
import { IoTicket } from "react-icons/io5";

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
  // Create a daily seed based on the current date for consistent shop across users
  const now = new Date();
  const seed = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
  const seededRandom = createSeededRandom(seed);
  
  // Define all possible ticket types
  const ticketTypes = [
    {
      type: "tokens" as const,
      name: "Golden Fortune",
      price: 25,
      description: "Win tokens! Try your luck with this golden ticket.",
      // Diamond is 1%, others are 24.75% each
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
      description: "Win anything with a 100x multiplier! High risk but incredible rewards if you hit!",
      chance: 24.75,
    },
    {
      type: "diamond" as const,
      name: "Diamond Scratch",
      price: 200,
      description: "1% Chance of appearing, win anything with a 300x multiplier! The ultimate premium ticket!",
      chance: 1,
    }
  ];
  
  // Generate 8 random tickets for the shop
  const totalShopSlots = 8;
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
  for (let i = 0; i < totalShopSlots; i++) {
    const selectedTicketType = selectRandomTicketType();
    
    // Determine if this is a bonus ticket (25% chance)
    const isBonus = seededRandom() < 0.25;
    
    const bonusDescription = isBonus 
      ? `Another chance to win with a ${selectedTicketType.type} ticket! 25% Higher Reward!`
      : selectedTicketType.description;
    
    shopTickets.push({
      id: `${selectedTicketType.type}${isBonus ? '-bonus' : ''}-${generateUUID()}`,
      name: selectedTicketType.name,
      price: selectedTicketType.price,
      type: selectedTicketType.type,
      description: isBonus ? bonusDescription : selectedTicketType.description,
      createdAt: new Date().toISOString(),
      isBonus
    });
  }
  
  return shopTickets;
};

// Function to get the day key for storing daily shop
const getDayKey = () => {
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
};

export default function ScratchOffs() {
  const [shopTickets, setShopTickets] = useState<ScratchTicket[]>([]);
  const [purchasedTickets, setPurchasedTickets] = useState<ScratchTicket[]>([]);
  const [userTokens, setUserTokens] = useState<number | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();
  const { data: session } = authClient.useSession();
  
  // Load purchased tickets from localStorage and the API
  useEffect(() => {
    if (typeof window !== 'undefined' && session?.user?.id) {
      const fetchUserTickets = async () => {
        try {
          // First try to get tickets from API
          const response = await fetch('/api/users/scratch-tickets', {
            credentials: 'include',
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.tickets && Array.isArray(data.tickets)) {
              // Filter out played tickets
              const activeTickets = data.tickets.filter((ticket: { scratched: boolean }) => !ticket.scratched);
              setPurchasedTickets(activeTickets);
              return;
            }
          } else {
            throw new Error('Failed to fetch tickets from API');
          }
        } catch (error) {
          console.error('Error fetching user tickets:', error);
          
          // Only fallback to localStorage if API fails
          const userId = session.user.id;
          const savedTickets = localStorage.getItem(`user-${userId}-tickets`);
          
          if (savedTickets) {
            try {
              const tickets = JSON.parse(savedTickets);
              // Filter out played tickets
              const activeTickets = tickets.filter((ticket: { scratched: boolean }) => !ticket.scratched);
              setPurchasedTickets(activeTickets);
            } catch (error) {
              console.error('Error parsing saved tickets:', error);
            }
          }
        }
      };
      
      fetchUserTickets();
      
      // Set up event listener for ticket refresh
      const handleStorageChange = (e: StorageEvent) => {
        if (e.key === 'ticket-played') {
          fetchUserTickets();
        }
      };
      
      window.addEventListener('storage', handleStorageChange);
      
      return () => {
        window.removeEventListener('storage', handleStorageChange);
      };
    }
  }, [session?.user?.id]);
  
  // Generate daily shop tickets once per day
  useEffect(() => {
    const dayKey = getDayKey();
    const savedShopKey = localStorage.getItem('shop-day-key');
    
    const fetchDailyShop = async () => {
      setIsSyncing(true);
      
      try {
        // Fetch the daily shop from the API
        const response = await fetch('/api/daily-shop');
        
        if (!response.ok) {
          throw new Error(`Error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data && data.tickets && Array.isArray(data.tickets)) {
          // Save the shop to localStorage
          localStorage.setItem('shop-day-key', data.dayKey);
          localStorage.setItem('daily-shop', JSON.stringify(data.tickets));
          
          // Mark tickets as purchased if they're in the user's purchased tickets
          let shopData = data.tickets;
          if (purchasedTickets.length > 0) {
            const purchasedIds = new Set(purchasedTickets.map(ticket => ticket.id));
            shopData = shopData.map((ticket: ScratchTicket) => ({
              ...ticket,
              purchased: purchasedIds.has(ticket.id)
            }));
          }
          
          setShopTickets(shopData);
        } else {
          throw new Error('Invalid shop data from API');
        }
      } catch (error) {
        console.error('Error fetching daily shop:', error);
        
        // Fallback to local generation if API fails
        let shopData: ScratchTicket[] = [];
        
        if (savedShopKey === dayKey) {
          // Load saved shop for today from localStorage
          const savedShop = localStorage.getItem('daily-shop');
          if (savedShop) {
            try {
              shopData = JSON.parse(savedShop);
            } catch (error) {
              console.error('Error parsing saved shop:', error);
              shopData = generateDailyShop();
            }
          } else {
            shopData = generateDailyShop();
          }
        } else {
          // Generate new shop for today
          shopData = generateDailyShop();
          localStorage.setItem('shop-day-key', dayKey);
          localStorage.setItem('daily-shop', JSON.stringify(shopData));
        }
        
        // Mark tickets as purchased if they're in the user's purchased tickets
        if (purchasedTickets.length > 0) {
          const purchasedIds = new Set(purchasedTickets.map(ticket => ticket.id));
          shopData = shopData.map((ticket: ScratchTicket) => ({
            ...ticket,
            purchased: purchasedIds.has(ticket.id)
          }));
        }
        
        setShopTickets(shopData);
      } finally {
        setIsSyncing(false);
      }
    };
    
    // Only fetch from API if it's a new day or we don't have a saved shop
    if (savedShopKey !== dayKey || !localStorage.getItem('daily-shop')) {
      fetchDailyShop();
    } else {
      // Load saved shop data from localStorage
      const savedShop = localStorage.getItem('daily-shop');
      if (savedShop) {
        try {
          let shopData = JSON.parse(savedShop);
          
          // Mark tickets as purchased
          if (purchasedTickets.length > 0) {
            const purchasedIds = new Set(purchasedTickets.map(ticket => ticket.id));
            shopData = shopData.map((ticket: ScratchTicket) => ({
              ...ticket,
              purchased: purchasedIds.has(ticket.id)
            }));
          }
          
          setShopTickets(shopData);
        } catch (error) {
          console.error('Error parsing saved shop:', error);
          fetchDailyShop(); // Fallback to fetching if parsing fails
        }
      } else {
        fetchDailyShop(); // Fallback to fetching if no saved shop
      }
    }
  }, [purchasedTickets]);
  
  // Fetch user's token balance
  useEffect(() => {
    const fetchUserTokens = async () => {
      if (!session?.user) return;
      
      try {
        const response = await fetch('/api/user', {
          credentials: 'include',
        });
        
        if (response.ok) {
          const data = await response.json();
          setUserTokens(data.tokenCount || 0);
        }
      } catch (error) {
        console.error('Error fetching user tokens:', error);
      }
    };
    
    fetchUserTokens();
  }, [session?.user]);
  
  // Save purchased tickets to localStorage when they change
  useEffect(() => {
    if (typeof window !== 'undefined' && session?.user?.id && purchasedTickets.length > 0) {
      const userId = session.user.id;
      localStorage.setItem(`user-${userId}-tickets`, JSON.stringify(purchasedTickets));
    }
  }, [purchasedTickets, session?.user?.id]);
  
  // Handle ticket purchase
  const handleTicketPurchase = async (ticket: ScratchTicket) => {
    if (!session?.user) {
      toast({
        title: "Error",
        description: "You must be logged in to purchase tickets",
      });
      return;
    }
    
    if (userTokens === null || isSyncing) return;
    
    // Check if user has enough tokens
    if (userTokens < ticket.price) {
      toast({
        title: "Insufficient Tokens",
        description: `You need ${ticket.price} tokens to purchase this ticket.`,
      });
      return;
    }
    
    setIsSyncing(true);
    
    try {
      // Call API to purchase ticket
      const response = await fetch(`/api/users/scratch-tickets?id=${ticket.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          price: ticket.price,
          type: ticket.type,
          name: ticket.name,
          isBonus: ticket.isBonus
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to purchase ticket');
      }
      
      const data = await response.json();
      
      // Update token count from server response
      setUserTokens(data.tokenCount);
      
      // Add to purchased tickets with client-side data
      const newTicket = {
        ...ticket,
        purchased: true,
      };
      
      setPurchasedTickets(prev => [...prev, newTicket]);
      
      // Mark shop ticket as purchased
      setShopTickets(prev => 
        prev.map(t => t.id === ticket.id ? { ...t, purchased: true } : t)
      );
      
      toast({
        title: "Purchase Successful",
        description: `You bought a ${ticket.name} ticket! Find it in your tickets.`,
      });
    } catch (error) {
      console.error('Error purchasing ticket:', error);
      toast({
        title: "Purchase Failed",
        description: error instanceof Error ? error.message : 'An unknown error occurred',
      });
    } finally {
      setIsSyncing(false);
    }
  };
  
  return (
    <div className="space-y-6 max-w-screen-2xl mx-auto px-4">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white mb-4">Scratch Offs</h1>
      </div>
      
      <Suspense fallback={
        <div className="w-full bg-gray-800 p-6 mb-8 flex justify-center items-center h-40">
          <LoadingStateAnimation />
        </div>
      }>
        <UserTicketsList purchasedTickets={purchasedTickets} />
      </Suspense>
      
      <Suspense fallback={
        <div className="w-full bg-gray-800 p-6 mb-8 flex justify-center items-center h-40">
          <LoadingStateAnimation />
        </div>
      }>
        <ScratchTicketShop 
          tickets={shopTickets} 
          title="Daily Shop" 
          subtitle="New tickets available every day. Get yours now!"
          onPurchase={handleTicketPurchase}
        />
      </Suspense>
    </div>
  );
} 