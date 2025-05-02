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
      description: "Win anything with a 100x multiplier! High risk but incredible rewards if you hit!",
      chance: 24.75,
    },
    {
      type: "diamond" as const,
      name: "Diamond Scratch",
      price: 200,
      description: "ULTRA RARE - 1% CHANCE TO APPEAR! Win anything with a 300x multiplier!",
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
    
    const fetchAndSetShop = async () => {
      console.log("fetchAndSetShop called");
      setIsSyncing(true);
      let generatedShop: ScratchTicket[] = [];
      let fetchedUserTickets: UserScratchTicket[] = [];

      try {
        // 1. Fetch user tickets first to know what's purchased
        console.log("Fetching user tickets before shop...");
        fetchedUserTickets = await fetchUserTickets(); // Ensure this returns the tickets
        console.log(`Fetched ${fetchedUserTickets.length} user tickets`);
        
        // Make sure we're using shopTicketId for tracking purchases if available
        const purchasedShopIds = new Set(
          fetchedUserTickets
            .map(t => t.shopTicketId || t.id) // Use shopTicketId when available, fallback to ticket id
            .filter(Boolean)
        );
        console.log("Purchased shop IDs:", Array.from(purchasedShopIds));

        // Get purchased ticket IDs from localStorage as well
        const currentDayKey = getDayKey();
        const storageKey = `purchased-shop-tickets-${currentDayKey}`;
        let localPurchasedIds: string[] = [];
        
        try {
          const localData = localStorage.getItem(storageKey);
          if (localData) {
            localPurchasedIds = JSON.parse(localData);
            console.log("Additional purchased tickets from localStorage:", localPurchasedIds);
            
            // Add these to the purchasedShopIds set
            localPurchasedIds.forEach(id => purchasedShopIds.add(id));
          }
        } catch (e) {
          console.error("Error reading localStorage purchased tickets:", e);
        }

        // 2. Try fetching shop from API
        try {
          console.log("Fetching daily shop from API...");
          const response = await fetch('/api/daily-shop');
          if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
          }
          const data = await response.json();
          if (data && data.tickets && Array.isArray(data.tickets)) {
            console.log(`Received ${data.tickets.length} tickets from API`);
            generatedShop = data.tickets;
            localStorage.setItem('shop-day-key', data.dayKey);
            localStorage.setItem('daily-shop', JSON.stringify(data.tickets));
          } else {
            throw new Error('Invalid shop data from API');
          }
        } catch (apiError) {
          console.error('Error fetching daily shop from API, falling back to local generation:', apiError);
          // Fallback to local generation if API fails
          const savedShop = localStorage.getItem('daily-shop');
          const currentDayKey = getDayKey();
          if (savedShopKey === currentDayKey && savedShop) {
            try {
              console.log("Using saved shop from localStorage");
              generatedShop = JSON.parse(savedShop);
            } catch { 
              console.log("Parsing saved shop failed, generating locally");
              generatedShop = generateDailyShop(); 
            }
          } else {
            console.log("Generating new shop locally");
            generatedShop = generateDailyShop();
            localStorage.setItem('shop-day-key', currentDayKey);
            localStorage.setItem('daily-shop', JSON.stringify(generatedShop));
          }
        }

        // 3. Mark tickets as purchased based on fetched user tickets and localStorage
        console.log("Marking purchased status on shop tickets");
        const finalShopTickets = generatedShop.map(ticket => ({
          ...ticket,
          purchased: purchasedShopIds.has(ticket.id)
        }));

        console.log(`Final shop tickets count: ${finalShopTickets.length}`);
        setShopTickets(finalShopTickets);
        
      } catch (error) {
        console.error('Error in fetchAndSetShop:', error);
        setHasError("Failed to load the scratch ticket shop. Please try again.");
      } finally {
        setIsSyncing(false);
      }
    };

    fetchAndSetShop();
    
  }, [session?.user?.id]); // Depend only on session to fetch initially
  
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
  
  // Handle ticket purchase
  const handleTicketPurchase = async (ticket: ScratchTicket) => {
    console.log("handleTicketPurchase called with ticket:", ticket);
    
    if (!session?.user) {
      console.error("No user session for purchase");
      toast({ title: "Error", description: "You must be logged in to purchase tickets" });
      return;
    }
    
    // Use isSyncing state directly
    if (userTokens === null || isSyncing) { 
      console.log("Purchase aborted: tokens null or already syncing", { userTokens, isSyncing });
      return;
    }
    
    // Check purchased status from the *current* shopTickets state
    const currentTicketState = shopTickets.find(t => t.id === ticket.id);
    if (!currentTicketState) {
      console.error("Ticket not found in current shop state:", ticket.id);
      toast({ title: "Error", description: "Ticket not found in the shop." });
      return;
    }
    if (currentTicketState.purchased) {
      console.log("Ticket already marked as purchased in state", ticket.id);
      toast({ title: "Already Purchased", description: "You have already purchased this ticket." });
      return;
    }

    // Check token balance (keep as is)
    if (userTokens < ticket.price) { 
      console.log("Insufficient tokens for purchase", { userTokens, price: ticket.price });
      toast({ title: "Insufficient Tokens", description: `You need ${ticket.price} tokens to purchase this ticket.` });
      return;
    }
    
    console.log("Starting purchase process for ticket", ticket.id);
    setIsSyncing(true); // Set loading state for the shop
    
    try {
      // Optimistic UI update for tokens
      setUserTokens((current) => {
        const newValue = current !== null ? current - ticket.price : null;
        console.log(`Optimistically updating tokens: ${current} -> ${newValue}`);
        return newValue;
      });
      // Optimistic UI update for shop ticket (avoids flicker)
      setShopTickets(prev => 
        prev.map(t => t.id === ticket.id ? { ...t, purchased: true } : t)
      );

      // Call API to purchase ticket
      console.log("Sending API request to purchase ticket", ticket.id);
      const response = await fetch(`/api/users/scratch-tickets?id=${ticket.id}`, { // Keep original DB ID in query param for now
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify({
          price: ticket.price,
          type: ticket.type,
          name: ticket.name,
          isBonus: ticket.isBonus || false,
          shopTicketId: ticket.id // Pass the deterministic ID
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
        
        // Revert optimistic updates if purchase fails
        console.log("Reverting optimistic updates due to error");
        setShopTickets(prev => 
          prev.map(t => t.id === ticket.id ? { ...t, purchased: false } : t) // Revert shop state
        );
        // Fetch actual token count to revert
        const tokenResponse = await fetch('/api/user', { credentials: 'include' });
        if (tokenResponse.ok) {
          const userData = await tokenResponse.json();
          console.log("Retrieved user token count for revert:", userData.tokenCount);
          setUserTokens(userData.tokenCount || 0);
        } else {
          console.error("Failed to retrieve token count after error:", tokenResponse.status);
          // Keep the potentially incorrect optimistic token count as a fallback
        }
        
        throw new Error(errorMessage);
      }
      
      let data;
      try {
        data = await response.json();
        console.log("Purchase successful, response data:", data);
      } catch (parseError) {
        console.error("Error parsing success response:", parseError);
        // Even if parsing fails, the purchase likely succeeded on the backend.
        // Keep optimistic UI state, but log error and show generic success.
        toast({ title: "Purchase Successful", description: `You bought a ${ticket.name} ticket!` });
        // Attempt to refresh user tickets anyway
        await fetchUserTickets(); 
        throw new Error("Failed to parse server response, but purchase likely succeeded."); 
      }
      
      // Update token count from server response (more accurate)
      console.log("Updating token count from server:", data.tokenCount);
      setUserTokens(data.tokenCount);
      
      // Add the newly purchased ticket to the UserTicketsList state
      // Use the data returned from the API which includes the correct UserScratchTicket ID
      const newDbTicket: UserScratchTicket = {
        id: data.ticket.id, // UserScratchTicket DB ID
        ticketId: data.ticket.ticketId, // Original ScratchTicket DB ID
        shopTicketId: data.ticket.shopTicketId, // Deterministic Shop ID
        userId: session.user.id,
        purchased: true,
        scratched: false,
        createdAt: data.ticket.createdAt || new Date().toISOString(),
        isBonus: data.ticket.isBonus,
        dayKey: data.ticket.dayKey || getDayKey(), // Add dayKey property
        ticket: { // Reconstruct the related ticket data if needed
          id: data.ticket.ticketId,
          name: data.ticket.ticket?.name || ticket.name, 
          type: data.ticket.ticket?.type as any || ticket.type,
          price: data.ticket.ticket?.price || ticket.price,
        }
      };
      console.log("Adding new DB ticket to purchasedTickets state:", newDbTicket);
      setPurchasedTickets(prev => {
        // Avoid duplicates based on the UserScratchTicket DB ID
        if (prev.some(t => t.id === newDbTicket.id)) {
          return prev;
        }
        return [...prev, newDbTicket];
      });
      
      // The shop ticket is already marked as purchased optimistically
      console.log("Shop ticket already marked as purchased optimistically.");
      
      toast({
        title: "Purchase Successful",
        description: `You bought a ${ticket.name} ticket! Find it in your tickets.`,
      });
      
      // Store the purchased ticket ID in localStorage
      storePurchasedTicketId(ticket.id);
      
      // Dispatch update events
      if (typeof window !== 'undefined') {
          const timestamp = Date.now().toString();
          console.log("Dispatching update events with timestamp:", timestamp);
          // Custom Event first
          try {
              window.dispatchEvent(new CustomEvent('tickets-updated'));
              console.log("Custom event 'tickets-updated' dispatched");
          } catch (e) { console.error("Error dispatching custom event:", e); }
          // Storage Event as fallback
          try {
              localStorage.setItem('tickets-updated', timestamp);
              window.dispatchEvent(new StorageEvent('storage', { key: 'tickets-updated', newValue: timestamp }));
              console.log("Storage event 'tickets-updated' dispatched");
          } catch (e) { console.error("Error dispatching storage event:", e); }
      }
    } catch (error) {
      console.error('Error during ticket purchase transaction:', error);
      // Don't show purchase failed toast if it was just a parse error after success
      if (!(error instanceof Error && error.message.includes("purchase likely succeeded"))) {
        toast({
          title: "Purchase Failed",
          description: error instanceof Error ? error.message : 'An unknown error occurred',
        });
      }
    } finally {
      console.log("Purchase process completed for ticket:", ticket.id);
      setIsSyncing(false); // Finish loading state
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
  
  // Modify fetchUserTickets to return the tickets and use shopTicketId
  const fetchUserTickets = async (): Promise<UserScratchTicket[]> => {
    console.log("Fetching user tickets...");
    let ticketsToReturn: UserScratchTicket[] = [];
    try {
      // First try to get tickets from API
      const response = await fetch('/api/users/scratch-tickets?includeScratched=true', { // Include scratched to check purchase status properly
        credentials: 'include',
        cache: 'no-store' // Ensure fresh data
      });
      console.log("Fetch user tickets API status:", response.status);
      
      if (!response.ok) {
        if (response.status >= 500) {
          console.error('Server error fetching tickets:', response.status, response.statusText);
          setHasError("We're having trouble loading your scratch tickets. Please try again later.");
        }
        // Don't throw error here, allow fallback to potentially empty list
        console.error('Failed to fetch tickets from API:', response.statusText);
      } else {
        const data = await response.json();
        if (data.tickets && Array.isArray(data.tickets)) {
          console.log(`Fetched ${data.tickets.length} tickets from API`);
          // Map to ensure correct shape, filter out unscratched if needed later
          ticketsToReturn = data.tickets.map((t: any) => ({ // Map to UserScratchTicket type
            id: t.id,
            ticketId: t.ticketId,
            shopTicketId: t.shopTicketId || t.id,
            userId: t.userId,
            purchased: true, // All tickets returned are purchased
            scratched: t.scratched || false,
            createdAt: t.createdAt?.toString() || new Date().toISOString(),
            isBonus: t.isBonus || false,
            dayKey: t.dayKey || getDayKey(),
            ticket: t.ticket ? {
              id: t.ticket.id,
              name: t.ticket.name,
              type: t.ticket.type,
              price: t.ticket.price
            } : {
              id: t.id,
              name: "Scratch Ticket",
              type: "tokens" as ScratchTicketType,
              price: 25
            }
          }));
        } else {
          console.log("No tickets array in API response");
        }
      }
    } catch (error) {
      console.error('Error fetching user tickets API:', error);
      setHasError("Could not connect to fetch your tickets."); // Set specific error
    }
    
    // Update state with whatever tickets we managed to get (or empty array)
    console.log("Updating purchasedTickets state with count:", ticketsToReturn.length);
    setPurchasedTickets(ticketsToReturn);
    return ticketsToReturn; // Return the fetched tickets
  };
  
  // Store purchased ticket IDs in localStorage to persist between refreshes
  const storePurchasedTicketId = (ticketId: string) => {
    try {
      const key = 'purchased-shop-tickets';
      const currentDayKey = getDayKey();
      const storageKey = `${key}-${currentDayKey}`;
      
      // Get existing purchased tickets for today
      const existingData = localStorage.getItem(storageKey);
      let purchasedIds: string[] = [];
      
      if (existingData) {
        try {
          purchasedIds = JSON.parse(existingData);
          if (!Array.isArray(purchasedIds)) {
            purchasedIds = [];
          }
        } catch {
          purchasedIds = [];
        }
      }
      
      // Only add if not already in the list
      if (!purchasedIds.includes(ticketId)) {
        purchasedIds.push(ticketId);
        localStorage.setItem(storageKey, JSON.stringify(purchasedIds));
        console.log(`Saved purchased ticket ID to localStorage: ${ticketId}`);
      }
    } catch (error) {
      console.error('Error saving purchased ticket ID to localStorage:', error);
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
          isLoading={isSyncing}
        />
      </Suspense>
    </div>
  );
} 