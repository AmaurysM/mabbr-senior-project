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
  const [loadingError, setLoadingError] = useState<string | null>(null);
  
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
          // Deduplicate tickets by ID
          const uniqueTickets = data.tickets.reduce((acc: UserScratchTicket[], ticket: UserScratchTicket) => {
            // Check if we already have this ticket in our accumulator
            if (!acc.some(t => t.id === ticket.id)) {
              acc.push(ticket);
            }
            return acc;
          }, []);
          
          // Save API tickets to localStorage for resilience
          if (typeof window !== 'undefined' && session?.user?.id) {
            try {
              const userId = session.user.id;
              localStorage.setItem(`user-${userId}-tickets`, JSON.stringify(uniqueTickets));
            } catch (saveError) {
              console.error('Error saving tickets to localStorage:', saveError);
            }
          }
          
          setTickets(uniqueTickets);
        } else {
          setTickets([]);
        }
      } catch (error) {
        console.error("Error fetching scratch tickets:", error);
        setError("Failed to load your scratch tickets. Please try again later.");
        
        // Fallback to localStorage if API fails
        if (typeof window !== 'undefined' && session?.user?.id) {
          const userId = session.user.id;
          const savedTickets = localStorage.getItem(`user-${userId}-tickets`);
          
          if (savedTickets) {
            try {
              const tickets = JSON.parse(savedTickets);
              // Filter out played tickets and deduplicate
              const activeTickets = tickets
                .filter((ticket: { scratched: boolean }) => !ticket.scratched)
                .reduce((acc: any[], ticket: any) => {
                  if (!acc.some(t => t.id === ticket.id)) {
                    acc.push(ticket);
                  }
                  return acc;
                }, []);
                
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
    
    // Set up storage event listeners to detect ticket changes
    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === 'ticket-played' || 
          e.key === 'tickets-updated' || 
          e.key?.includes('ticket-result-')) {
        fetchTickets();
      }
    };
    
    window.addEventListener('storage', handleStorageEvent);
    
    // Also listen for custom events from other components in the same window
    const handleCustomEvent = () => {
      fetchTickets();
    };
    
    // Add custom event listener for ticket updates
    window.addEventListener('tickets-updated', handleCustomEvent);
    
    return () => {
      window.removeEventListener('storage', handleStorageEvent);
      window.removeEventListener('tickets-updated', handleCustomEvent);
    };
  }, [session?.user?.id]);

  // Add a function to handle localStorage ticket saving
  // This function will be called when a new ticket is purchased
  const saveTicketToLocalStorage = (ticket: UserScratchTicket) => {
    if (!session?.user?.id) return;
    
    const userId = session.user.id;
    try {
      // Get existing tickets
      const savedTicketsStr = localStorage.getItem(`user-${userId}-tickets`);
      let savedTickets: UserScratchTicket[] = [];
      
      if (savedTicketsStr) {
        savedTickets = JSON.parse(savedTicketsStr);
      }
      
      // Check if ticket already exists
      const existingIndex = savedTickets.findIndex(t => t.id === ticket.id);
      if (existingIndex >= 0) {
        // Update existing ticket
        savedTickets[existingIndex] = ticket;
      } else {
        // Add new ticket
        savedTickets.push(ticket);
      }
      
      // Save back to localStorage
      localStorage.setItem(`user-${userId}-tickets`, JSON.stringify(savedTickets));
      
      // Update state
      setTickets(prev => {
        const newTickets = [...prev];
        const existingTicketIndex = newTickets.findIndex(t => t.id === ticket.id);
        if (existingTicketIndex >= 0) {
          newTickets[existingTicketIndex] = ticket;
        } else {
          newTickets.push(ticket);
        }
        return newTickets;
      });
      
      // Trigger event for other components
      window.dispatchEvent(new CustomEvent('tickets-updated'));
    } catch (error) {
      console.error('Error saving ticket to localStorage:', error);
    }
  };

  // Register this function globally for cross-component communication
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).saveTicketToLocalStorage = saveTicketToLocalStorage;
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        delete (window as any).saveTicketToLocalStorage;
      }
    };
  }, []);

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

  // Function to handle play action (redirects to scratch off page)
  const playTicket = (ticketId: string) => {
    try {
      window.location.href = `/games/scratch-offs/play?id=${ticketId}`;
    } catch (error) {
      console.error("Error navigating to play page:", error);
      setLoadingError("Failed to navigate to the game page. Please try again.");
    }
  };

  // Group tickets by type for presentation
  const groupTicketsByType = () => {
    const groups: Record<string, UserScratchTicket[]> = {};
    
    tickets.forEach(ticket => {
      const type = ticket.ticket?.type || 'unknown';
      if (!groups[type]) {
        groups[type] = [];
      }
      groups[type].push(ticket);
    });
    
    return groups;
  };
  
  const ticketGroups = groupTicketsByType();

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

  if (purchasedTickets.length === 0) {
    return (
      <div id="my-tickets-section" className="w-full bg-gray-800 p-6 mb-6 rounded-lg">
        <h2 className="text-2xl font-bold text-white mb-4">My Tickets</h2>
        <div className="text-center p-8 border border-gray-700 rounded-lg bg-gray-800/50">
          <p className="text-gray-400">You don't have any scratch tickets yet. Purchase some from the shop below!</p>
        </div>
      </div>
    );
  }

  return (
    <div id="my-tickets-section" className="w-full bg-gray-800 p-6 mb-6 rounded-lg">
      <h2 className="text-2xl font-bold text-white mb-4">My Tickets</h2>
      
      {Object.entries(ticketGroups).map(([type, tickets]) => (
        <div key={type} className="mb-6 last:mb-0">
          <h3 className="text-xl font-semibold text-white mb-3 capitalize">{type} Tickets</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {tickets.map((ticket) => (
              <div key={ticket.id} className="relative">
                <div 
                  onClick={() => playTicket(ticket.id)}
                  className="cursor-pointer transform transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <OwnedScratchTicket userTicket={ticket} onClick={() => playTicket(ticket.id)} />
                </div>
                <button
                  onClick={() => playTicket(ticket.id)}
                  className="mt-2 w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-md transition-colors"
                >
                  Play Now
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default UserTicketsList; 