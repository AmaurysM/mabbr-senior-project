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
      description: "Win anything with a 100x multiplier! High risk but incredible rewards if you hit!",
      chance: 24.75,
    },
    {
      type: "diamond" as const,
      name: "Diamond Scratch",
      price: 200,
      description: "1% Chance of appearing, win anything with a 300x multiplier! The ultimate premium ticket!",
      chance: 1.0, // Explicitly set to 1.0% chance
    }
  ];
  
  // Verify that probabilities sum to 100%
  const totalChance = ticketTypes.reduce((sum, type) => sum + type.chance, 0);
  console.log(`Total chance: ${totalChance}%`); // Should be 100%
  
  // Generate 12 random tickets for the shop (was previously 8)
  const totalShopSlots = 12;
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
  
  // Log the distribution of tickets for verification
  const distribution = shopTickets.reduce((acc: any, ticket) => {
    acc[ticket.type] = (acc[ticket.type] || 0) + 1;
    return acc;
  }, {});
  
  console.log('Daily shop distribution:', distribution);
  console.log('Bonus tickets:', shopTickets.filter(t => t.isBonus).length);
  
  return shopTickets;
};

// Function to get the day key for storing daily shop
const getDayKey = () => {
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
};

export default function ScratchOffs() {
  const [shopTickets, setShopTickets] = useState<ScratchTicket[]>([]);
  const [purchasedTickets, setPurchasedTickets] = useState<UserScratchTicket[]>([]);
  const [userTokens, setUserTokens] = useState<number | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [hasError, setHasError] = useState<string | null>(null);
  
  const { toast } = useToast();
  const { data: session } = authClient.useSession();
  
  // Dynamic import of fallback component
  const ScratchOffsFallback = lazy(() => import('./ScratchOffsFallback'));
  
  const handlePageRetry = () => {
    setHasError(null);
    window.location.reload();
  };
  
  // Load purchased tickets from localStorage and the API
  useEffect(() => {
    if (typeof window !== 'undefined' && session?.user?.id) {
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
          
          // Get unique purchased ticket IDs for more accurate marking
          const purchasedIds = new Set();
          if (purchasedTickets.length > 0) {
            purchasedTickets.forEach(ticket => {
              purchasedIds.add(ticket.id);
              // Only add ticketId if it's not a ScratchTicket (which doesn't have ticketId)
              if ('ticketId' in ticket) {
                purchasedIds.add((ticket as any).ticketId);
              }
            });
          }
          
          // Mark tickets as purchased if they're in the user's purchased tickets
          let shopData = data.tickets.map((ticket: ScratchTicket) => ({
            ...ticket,
            purchased: purchasedIds.has(ticket.id)
          }));
          
          setShopTickets(shopData);
        } else {
          throw new Error('Invalid shop data from API');
        }
      } catch (error) {
        console.error('Error fetching daily shop:', error);
        
        if (error instanceof Error && error.message.includes('500')) {
          // Set error state for server errors
          setHasError("We're having trouble connecting to the shop right now. Please try again later.");
        }
        
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
        // Get unique purchased ticket IDs
        const purchasedIds = new Set();
        if (purchasedTickets.length > 0) {
          purchasedTickets.forEach(ticket => {
            purchasedIds.add(ticket.id);
            // Only add ticketId if it's not a ScratchTicket (which doesn't have ticketId)
            if ('ticketId' in ticket) {
              purchasedIds.add((ticket as any).ticketId);
            }
          });
        }
        
        shopData = shopData.map((ticket: ScratchTicket) => ({
          ...ticket,
          purchased: purchasedIds.has(ticket.id)
        }));
        
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
    console.log("handleTicketPurchase called with ticket:", ticket);
    
    if (!session?.user) {
      console.error("No user session for purchase");
      toast({
        title: "Error",
        description: "You must be logged in to purchase tickets",
      });
      return;
    }
    
    if (userTokens === null || isSyncing) {
      console.log("Purchase aborted: tokens null or already syncing", { userTokens, isSyncing });
      return;
    }
    
    // Check if user has enough tokens
    if (userTokens < ticket.price) {
      console.log("Insufficient tokens for purchase", { userTokens, price: ticket.price });
      toast({
        title: "Insufficient Tokens",
        description: `You need ${ticket.price} tokens to purchase this ticket.`,
      });
      return;
    }

    // Check if ticket is already marked as purchased
    if (ticket.purchased) {
      console.log("Ticket already purchased", ticket.id);
      toast({
        title: "Already Purchased",
        description: "You've already purchased this ticket.",
      });
      return;
    }
    
    console.log("Starting purchase process for ticket", ticket.id);
    setIsSyncing(true);
    
    try {
      // Optimistically update the UI immediately
      setUserTokens((current) => {
        const newValue = current !== null ? current - ticket.price : null;
        console.log(`Optimistically updating tokens: ${current} -> ${newValue}`);
        return newValue;
      });
      
      // Call API to purchase ticket
      console.log("Sending API request to purchase ticket", ticket.id);
      const response = await fetch(`/api/users/scratch-tickets?id=${ticket.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify({
          price: ticket.price,
          type: ticket.type,
          name: ticket.name,
          isBonus: ticket.isBonus || false
        }),
        credentials: 'include'
      });
      
      console.log("API response status:", response.status);
      
      if (!response.ok) {
        let errorMessage = `Server error (${response.status})`;
        try {
          const errorData = await response.json();
          console.error("Error response:", errorData);
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          console.error("Error parsing error response:", parseError);
        }
        
        // Revert optimistic update if purchase fails
        console.log("Reverting optimistic token update");
        const tokenResponse = await fetch('/api/user', { credentials: 'include' });
        if (tokenResponse.ok) {
          const userData = await tokenResponse.json();
          console.log("Retrieved user token count:", userData.tokenCount);
          setUserTokens(userData.tokenCount || 0);
        } else {
          console.error("Failed to retrieve token count after error:", tokenResponse.status);
        }
        
        throw new Error(errorMessage);
      }
      
      let data;
      try {
        data = await response.json();
        console.log("Purchase successful, response data:", data);
      } catch (parseError) {
        console.error("Error parsing success response:", parseError);
        throw new Error("Failed to parse server response");
      }
      
      // Update token count from server response
      console.log("Updating token count from server:", data.tokenCount);
      setUserTokens(data.tokenCount);
      
      // Add to purchased tickets with server-side data
      console.log("Creating new user ticket from response");
      const newTicket: UserScratchTicket = {
        id: data.ticket.id,
        ticketId: data.ticket.id,
        userId: session.user.id,
        purchased: true,
        scratched: false,
        createdAt: new Date().toISOString(),
        isBonus: data.ticket.isBonus,
        ticket: {
          id: data.ticket.id,
          name: data.ticket.name,
          type: data.ticket.type as any, // Handle any TicketType conversion
          price: data.ticket.price,
        }
      };
      
      // Check if ticket already exists in purchasedTickets by ID
      const ticketExists = purchasedTickets.some(t => t.id === data.ticket.id);
      console.log("Ticket already exists in purchased tickets:", ticketExists);
      
      if (!ticketExists) {
        console.log("Adding new ticket to purchased tickets");
        setPurchasedTickets(prev => [...prev, newTicket]);
      }
      
      // Mark shop ticket as purchased
      console.log("Marking shop ticket as purchased");
      setShopTickets(prev => 
        prev.map(t => t.id === ticket.id ? { ...t, purchased: true } : t)
      );
      
      toast({
        title: "Purchase Successful",
        description: `You bought a ${ticket.name} ticket! Find it in your tickets.`,
      });
      
      // Force an immediate refresh of tickets to ensure the My Tickets section updates
      console.log("Forcing refresh of user tickets");
      await fetchUserTickets();
      
      // Trigger the storage event to notify other components about the change
      if (typeof window !== 'undefined') {
        const timestamp = Date.now().toString();
        console.log("Setting localStorage updates with timestamp:", timestamp);
        window.localStorage.setItem('tickets-updated', timestamp);
        
        // Use both storage event and custom event for better coverage
        try {
          window.dispatchEvent(new StorageEvent('storage', {
            key: 'tickets-updated',
            newValue: timestamp
          }));
          console.log("Storage event dispatched");
          
          window.dispatchEvent(new CustomEvent('tickets-updated'));
          console.log("Custom event dispatched");
        } catch (eventError) {
          console.error("Error dispatching events:", eventError);
        }
      }
    } catch (error) {
      console.error('Error purchasing ticket:', error);
      toast({
        title: "Purchase Failed",
        description: error instanceof Error ? error.message : 'An unknown error occurred',
      });
    } finally {
      console.log("Purchase process completed");
      setIsSyncing(false);
    }
  };
  
  // Add a polling mechanism to periodically check token counts
  useEffect(() => {
    if (!session?.user) return;
    
    const fetchTokens = async () => {
      try {
        const response = await fetch('/api/user', {
          credentials: 'include',
        });
        
        if (response.ok) {
          const data = await response.json();
          setUserTokens(data.tokenCount || 0);
        }
      } catch (error) {
        console.error('Error fetching token update:', error);
      }
    };
    
    // Initial fetch
    fetchTokens();
    
    // Set up polling every 10 seconds
    const intervalId = setInterval(fetchTokens, 10000);
    
    // Set up event listener for token updates
    const handleTokenUpdate = () => fetchTokens();
    window.addEventListener('token-update', handleTokenUpdate);
    
    return () => {
      clearInterval(intervalId);
      window.removeEventListener('token-update', handleTokenUpdate);
    };
  }, [session?.user]);
  
  // Extract the fetchUserTickets function to be reusable
  const fetchUserTickets = async () => {
    try {
      // First try to get tickets from API
      const response = await fetch('/api/users/scratch-tickets', {
        credentials: 'include',
      });
      
      if (!response.ok) {
        // Set error for server errors
        if (response.status === 500) {
          console.error('Server error fetching tickets:', response.status, response.statusText);
          setHasError("We're having trouble loading your scratch tickets. Please try again later.");
          throw new Error('Failed to fetch tickets from API');
        }
      }
      
      const data = await response.json();
      if (data.tickets && Array.isArray(data.tickets)) {
        // Filter out played tickets and deduplicate by ID
        const activeTickets = data.tickets
          .filter((ticket: { scratched: boolean }) => !ticket.scratched)
          .reduce((acc: any[], ticket: any) => {
            // Check if we already have this ticket ID
            if (!acc.some((t: any) => t.id === ticket.id)) {
              acc.push(ticket);
            }
            return acc;
          }, []);
        
        setPurchasedTickets(activeTickets);
        return;
      }
    } catch (error) {
      console.error('Error fetching user tickets:', error);
      
      // Only fallback to localStorage if API fails
      if (session?.user?.id) {
        const userId = session.user.id;
        const savedTickets = localStorage.getItem(`user-${userId}-tickets`);
        
        if (savedTickets) {
          try {
            const tickets = JSON.parse(savedTickets);
            // Filter out played tickets and deduplicate
            const activeTickets = tickets
              .filter((ticket: { scratched: boolean }) => !ticket.scratched)
              .reduce((acc: any[], ticket: any) => {
                // Check if we already have this ticket ID
                if (!acc.some((t: any) => t.id === ticket.id)) {
                  acc.push(ticket);
                }
                return acc;
              }, []);
            
            setPurchasedTickets(activeTickets);
          } catch (error) {
            console.error('Error parsing saved tickets:', error);
            setPurchasedTickets([]);
          }
        }
      }
    }
  };
  
  if (hasError) {
    return (
      <React.Suspense fallback={
        <div className="space-y-6 max-w-screen-2xl mx-auto px-4 py-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-white mb-4">Scratch Offs</h1>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg text-white text-center">
            Loading...
          </div>
        </div>
      }>
        <ScratchOffsFallback 
          onRetry={handlePageRetry} 
          errorMessage={hasError}
        />
      </React.Suspense>
    );
  }
  
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