"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import OwnedScratchTicket, { UserScratchTicket } from "@/app/components/OwnedScratchTicket";
import LoadingStateAnimation from "@/app/components/LoadingState";
import { authClient } from "@/lib/auth-client";

interface UserTicketsListProps {
  // This is now optional and used as fallback
  purchasedTickets?: any[];
}

const UserTicketsList: React.FC<UserTicketsListProps> = ({ 
  purchasedTickets = [] 
}) => {
  const router = useRouter();
  const [tickets, setTickets] = useState<UserScratchTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { data: session } = authClient.useSession();
  
  useEffect(() => {
    const fetchTickets = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/users/scratch-tickets");
        if (!response.ok) {
          throw new Error(`Error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        // Parse the tickets from the API response
        if (data.tickets && Array.isArray(data.tickets)) {
          setTickets(data.tickets);
        } else {
          setTickets([]);
        }
      } catch (error) {
        console.error("Error fetching scratch tickets:", error);
        setError("Failed to load your scratch tickets. Please try again later.");
        
        // Fallback to localStorage only if API fails
        if (typeof window !== 'undefined' && session?.user?.id) {
          const userId = session.user.id;
          const savedTickets = localStorage.getItem(`user-${userId}-tickets`);
          
          if (savedTickets) {
            try {
              const tickets = JSON.parse(savedTickets);
              // Filter out played tickets
              const activeTickets = tickets.filter((ticket: { scratched: boolean }) => !ticket.scratched);
              setTickets(activeTickets);
            } catch (error) {
              console.error('Error parsing saved tickets:', error);
            }
          }
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchTickets();
    
    // Set up event listener for tickets updates
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'ticket-played') {
        fetchTickets();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [session?.user?.id]);

  if (loading && tickets.length === 0) {
    return (
      <div className="w-full bg-gray-800 p-6 mb-8 flex justify-center items-center h-40">
        <LoadingStateAnimation />
      </div>
    );
  }
    
  if (error) {
    console.error("Error fetching scratch tickets:", error);
  }
    
  if (tickets.length === 0) {
    return (
      <div className="w-full bg-gray-800 p-6 mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">My Tickets</h2>
        <p className="text-gray-400 mb-6">You don&apos;t have any scratch tickets yet.</p>
      </div>
    );
  }

  const handleTicketClick = (ticketId: string) => {
    // Check if we have saved results for this ticket
    if (typeof window !== 'undefined') {
      // First check if the ticket has saved results (was already revealed)
      const savedResults = localStorage.getItem(`ticket-result-${ticketId}`);
      if (savedResults) {
        // If ticket was already revealed, still allow viewing it
        router.push(`/games/scratch-offs/play?ticketId=${ticketId}`);
        return;
      }
    }
    
    // If no saved results, proceed to play
    router.push(`/games/scratch-offs/play?ticketId=${ticketId}`);
  };

  return (
    <div className="w-full bg-gray-800 p-6">
      <h2 className="text-2xl font-bold text-white mb-2">My Tickets</h2>
      <p className="text-gray-400 mb-6">Click on a ticket to scratch it</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {tickets.map((ticket) => (
          <div key={ticket.id} onClick={() => handleTicketClick(ticket.id)}>
            <OwnedScratchTicket 
              key={ticket.id} 
              userTicket={ticket} 
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserTicketsList; 