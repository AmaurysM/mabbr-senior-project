"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import OwnedScratchTicket, { UserScratchTicket } from "@/app/components/OwnedScratchTicket";
import LoadingStateAnimation from "@/app/components/LoadingState";
import { authClient } from "@/lib/auth-client";

interface UserTicketsListProps {
  // This is now optional and used as fallback
  purchasedTickets?: UserScratchTicket[];
}

const UserTicketsList: React.FC<UserTicketsListProps> = ({ 
  purchasedTickets = [] 
}) => {
  const router = useRouter();
  const [tickets, setTickets] = useState<UserScratchTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { data: session } = authClient.useSession();
  const [loadingError, setLoadingError] = useState<string | null>(null);
  
  // Define fetchTickets with useCallback to avoid dependency issues
  const fetchTickets = useCallback(async () => {
    console.log("UserTicketsList: fetching tickets from API");
    setLoading(true);
    try {
      const response = await fetch("/api/users/scratch-tickets", {
        credentials: 'include',
        cache: 'no-store' // Prevent caching to ensure fresh data
      });
      
      if (!response.ok) {
        console.error("UserTicketsList: API error response:", response.status, response.statusText);
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log("UserTicketsList: received tickets from API:", data?.tickets?.length || 0);
      
      // Parse the tickets from the API response
      if (data.tickets && Array.isArray(data.tickets)) {
        // Deduplicate tickets by ID and ensure only unscratched tickets are included
        const uniqueTickets = data.tickets.reduce((acc: UserScratchTicket[], ticket: UserScratchTicket) => {
          // Check if we already have this ticket in our accumulator
          if (!acc.some((existingTicket: UserScratchTicket) => existingTicket.id === ticket.id)) {
            // Only add unscratched tickets
            if (!ticket.scratched) {
              // Make sure the dayKey is present
              if (!ticket.dayKey && ticket.createdAt) {
                ticket.dayKey = new Date(ticket.createdAt).toISOString().split('T')[0];
              }
              acc.push(ticket);
            }
          }
          return acc;
        }, []);
        
        console.log("UserTicketsList: filtered to unique unscratched tickets:", uniqueTickets.length);
        
        // Check for tickets stored in localStorage that might not be in the database
        try {
          if (typeof window !== 'undefined') {
            // Get tickets from localStorage
            const localTicketsStr = localStorage.getItem('userScratchTickets');
            if (localTicketsStr) {
              const localTickets = JSON.parse(localTicketsStr);
              console.log("UserTicketsList: found tickets in localStorage:", localTickets.length);
              
              // Add local tickets that aren't in the API response
              localTickets.forEach((localTicket: any) => {
                if (!localTicket.scratched && !uniqueTickets.some((existingTicket: UserScratchTicket) => existingTicket.id === localTicket.id)) {
                  console.log("UserTicketsList: adding local ticket to list:", localTicket.id);
                  // Make sure dayKey is present
                  if (!localTicket.dayKey && localTicket.createdAt) {
                    localTicket.dayKey = new Date(localTicket.createdAt).toISOString().split('T')[0];
                  }
                  uniqueTickets.push(localTicket);
                }
              });
              
              console.log("UserTicketsList: final ticket count with local additions:", uniqueTickets.length);
            }
          }
        } catch (localError) {
          console.error("UserTicketsList: Error reading localStorage tickets:", localError);
          // Continue with API tickets only
        }
        
        setTickets(uniqueTickets);
      } else {
        console.log("UserTicketsList: No tickets found in API response");
        
        // Check for tickets stored in localStorage as fallback
        try {
          if (typeof window !== 'undefined') {
            const localTicketsStr = localStorage.getItem('userScratchTickets');
            if (localTicketsStr) {
              const localTickets = JSON.parse(localTicketsStr);
              const unscratched = localTickets.filter((t: any) => !t.scratched);
              console.log("UserTicketsList: using localStorage tickets as fallback:", unscratched.length);
              setTickets(unscratched);
            } else {
              setTickets([]);
            }
          } else {
            setTickets([]);
          }
        } catch (localError) {
          console.error("UserTicketsList: Error reading localStorage tickets:", localError);
          setTickets([]);
        }
      }
    } catch (error) {
      console.error("UserTicketsList: Error fetching scratch tickets:", error);
      setError("Failed to load your scratch tickets. Please try again later.");
      
      // If API fails, try local storage first, then fallback to props
      try {
        if (typeof window !== 'undefined') {
          const localTicketsStr = localStorage.getItem('userScratchTickets');
          if (localTicketsStr) {
            const localTickets = JSON.parse(localTicketsStr);
            const unscratched = localTickets.filter((t: any) => !t.scratched);
            console.log("UserTicketsList: using localStorage tickets as fallback after API error:", unscratched.length);
            setTickets(unscratched);
          } else if (purchasedTickets.length > 0) {
            console.log("UserTicketsList: Using purchasedTickets as fallback after API error");
            // But still filter out scratched tickets
            const unscratched = purchasedTickets.filter(ticket => !ticket.scratched);
            setTickets(unscratched);
          }
        } else if (purchasedTickets.length > 0) {
          console.log("UserTicketsList: Using purchasedTickets as fallback after API error");
          // But still filter out scratched tickets
          const unscratched = purchasedTickets.filter(ticket => !ticket.scratched);
          setTickets(unscratched);
        }
      } catch (fallbackError) {
        console.error("UserTicketsList: Error with fallback ticket sources:", fallbackError);
        // Last resort - use props
        if (purchasedTickets.length > 0) {
          console.log("UserTicketsList: Using purchasedTickets as last resort fallback");
          const unscratched = purchasedTickets.filter(ticket => !ticket.scratched);
          setTickets(unscratched);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [purchasedTickets]);
  
  // Handle tickets passed as props
  useEffect(() => {
    if (purchasedTickets.length > 0) {
      console.log("UserTicketsList: received purchasedTickets via props:", purchasedTickets.length);
      
      // Filter out scratched tickets before setting them
      const unscratched = purchasedTickets.filter(ticket => !ticket.scratched);
      console.log("UserTicketsList: filtered to unscratched tickets:", unscratched.length);
      
      // Set only unscratched tickets
      setTickets(unscratched);
      setLoading(false);
    }
  }, [purchasedTickets]);
  
  // Set up event listeners for ticket updates
  const handleStorageEvent = useCallback((e: StorageEvent) => {
    if (e.key === 'tickets-updated') {
      console.log("UserTicketsList: Storage event triggered refresh");
      fetchTickets();
    }
  }, [fetchTickets]);
  
  // Custom event handler for ticket updates
  const handleTicketsUpdated = useCallback(() => {
    console.log("UserTicketsList: Custom event triggered refresh");
    
    // Force immediate UI refresh from localStorage first
    if (typeof window !== 'undefined') {
      try {
        const storedTicketsStr = localStorage.getItem('userScratchTickets');
        if (storedTicketsStr) {
          interface StoredTicket {
            id: string;
            scratched: boolean;
            [key: string]: any;
          }
          
          const parsedData: StoredTicket[] = JSON.parse(storedTicketsStr);
          const unscratched = parsedData.filter(ticket => !ticket.scratched);
          
          console.log("UserTicketsList: Quick refresh from localStorage, unscratched count:", unscratched.length);
          
          if (Array.isArray(unscratched)) {
            setTickets(unscratched as UserScratchTicket[]);
          }
        }
      } catch (e) {
        console.error("Error refreshing from localStorage:", e);
      }
    }
    
    // Also trigger a full API refresh
    fetchTickets();
  }, [fetchTickets]);
  
  // Effect for initial fetch and setting up event listeners
  useEffect(() => {
    // Only fetch if we have a session
    if (session?.user?.id) {
      fetchTickets();
    }
    
    // Set up event listeners
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageEvent);
      window.addEventListener('tickets-updated', handleTicketsUpdated as EventListener);
      
      return () => {
        window.removeEventListener('storage', handleStorageEvent);
        window.removeEventListener('tickets-updated', handleTicketsUpdated as EventListener);
      };
    }
  }, [session?.user?.id, fetchTickets, handleStorageEvent, handleTicketsUpdated]);

  // Show loading state only when we have no tickets and are still loading
  if (loading && tickets.length === 0 && purchasedTickets.length === 0) {
    return (
      <div className="w-full bg-gray-800 p-6 mb-8 flex justify-center items-center h-40">
        <LoadingStateAnimation />
      </div>
    );
  }
    
  if (error) {
    console.error("UserTicketsList: Error fetching scratch tickets:", error);
  }
  
  // Combine tickets from API and props, removing duplicates and scratched tickets
  const allTickets = [...tickets];
  
  // Add any unscratched tickets from props that aren't already in the API-fetched tickets
  purchasedTickets
    .filter(ticket => !ticket.scratched) // Only add unscratched tickets
    .forEach(propTicket => {
      if (!allTickets.some(t => t.id === propTicket.id)) {
        // Make sure dayKey is present
        if (!propTicket.dayKey && propTicket.createdAt) {
          propTicket.dayKey = new Date(propTicket.createdAt).toISOString().split('T')[0];
        }
        allTickets.push(propTicket);
      }
    });
    
  if (allTickets.length === 0) {
    return (
      <div className="w-full bg-gray-800 p-6 mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">My Tickets</h2>
        <p className="text-gray-400 mb-6">You don&apos;t have any scratch tickets yet.</p>
      </div>
    );
  }

  // Function to handle play action (redirects to scratch off page)
  const playTicket = (ticketId: string) => {
    try {
      console.log("UserTicketsList: Playing ticket:", ticketId);
      
      // Optimistically mark as scratched in the UI to prevent duplicated plays
      setTickets(prevTickets => prevTickets.filter(t => t.id !== ticketId));
      
      // Navigate to the play page
      window.location.href = `/games/scratch-offs/play?ticketId=${ticketId}`;
    } catch (error) {
      console.error("UserTicketsList: Error navigating to play page:", error);
      setLoadingError("Failed to navigate to the game page. Please try again.");
    }
  };

  // If there's an error, show a friendly error message with retry option
  if (loadingError) {
    return (
      <div id="my-tickets-section" className="w-full bg-gray-800 p-6 mb-6 rounded-lg">
        <h2 className="text-2xl font-bold text-white mb-4">My Tickets</h2>
        <div className="bg-red-900/30 border border-red-500/30 rounded-lg p-6 text-center">
          <p className="text-red-300 mb-4">{loadingError}</p>
          <button 
            onClick={() => {
              setLoadingError(null);
              window.location.reload();
            }}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div id="my-tickets-section" className="w-full bg-gray-800 p-6 mb-6 rounded-lg">
      <h2 className="text-2xl font-bold text-white mb-4">My Tickets</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {allTickets.map((ticket) => (
          <div key={ticket.id} className="relative">
            <div 
              onClick={() => playTicket(ticket.id)}
              className="cursor-pointer transform transition hover:-translate-y-1 hover:shadow-lg"
            >
              <OwnedScratchTicket userTicket={ticket} onClick={() => playTicket(ticket.id)} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserTicketsList; 