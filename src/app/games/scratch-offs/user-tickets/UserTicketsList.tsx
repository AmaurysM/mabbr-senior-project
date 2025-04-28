"use client";

import React, { useState, useEffect } from "react";
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
  
  // Handle tickets passed as props
  useEffect(() => {
    if (purchasedTickets.length > 0) {
      console.log("UserTicketsList: received purchasedTickets via props:", purchasedTickets.length);
      // If we have tickets from props, use them
      setTickets(purchasedTickets);
      setLoading(false);
    }
  }, [purchasedTickets]);
  
  useEffect(() => {
    const fetchTickets = async () => {
      if (loading) {
        console.log("UserTicketsList: fetching tickets from API");
      }
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
          // Deduplicate tickets by ID
          const uniqueTickets = data.tickets.reduce((acc: UserScratchTicket[], ticket: UserScratchTicket) => {
            // Check if we already have this ticket in our accumulator
            if (!acc.some(t => t.id === ticket.id)) {
              acc.push(ticket);
            }
            return acc;
          }, []);
          
          setTickets(uniqueTickets);
        } else {
          console.log("UserTicketsList: No tickets found in API response");
          setTickets([]);
        }
      } catch (error) {
        console.error("UserTicketsList: Error fetching scratch tickets:", error);
        setError("Failed to load your scratch tickets. Please try again later.");
        
        // If API fails but we have purchasedTickets, use those as fallback
        if (purchasedTickets.length > 0) {
          console.log("UserTicketsList: Using purchasedTickets as fallback after API error");
          setTickets(purchasedTickets);
        }
      } finally {
        setLoading(false);
      }
    };
    
    // Only fetch if we have a session and no tickets from props
    if (session?.user?.id) {
      fetchTickets();
    }
    
    // Set up event listeners for ticket updates
    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === 'tickets-updated') {
        console.log("UserTicketsList: Storage event triggered refresh");
        fetchTickets();
      }
    };
    
    // Custom event handler for ticket updates
    const handleTicketsUpdated = () => {
      console.log("UserTicketsList: Custom event triggered refresh");
      fetchTickets();
    };
    
    // Add both storage and custom event listeners
    window.addEventListener('storage', handleStorageEvent);
    window.addEventListener('tickets-updated', handleTicketsUpdated as EventListener);
    
    return () => {
      window.removeEventListener('storage', handleStorageEvent);
      window.removeEventListener('tickets-updated', handleTicketsUpdated as EventListener);
    };
  }, [session?.user?.id, purchasedTickets]);

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
  
  // Combine tickets from API and props, removing duplicates
  const allTickets = [...tickets];
  
  // Add any tickets from props that aren't already in the API-fetched tickets
  purchasedTickets.forEach(propTicket => {
    if (!allTickets.some(t => t.id === propTicket.id)) {
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