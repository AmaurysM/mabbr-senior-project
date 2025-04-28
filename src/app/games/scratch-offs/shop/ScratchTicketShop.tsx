"use client";

import React, { useState, useEffect } from "react";
import { ScratchTicket } from "@/app/components/ScratchTicketTile";
import ScratchTicketTile from "@/app/components/ScratchTicketTile";
import { authClient } from "@/lib/auth-client";
import { useToast } from "@/app/hooks/use-toast";

interface ScratchTicketShopProps {
  tickets: ScratchTicket[];
  title?: string;
  subtitle?: string;
  onPurchase?: (ticket: ScratchTicket) => void;
}

const ScratchTicketShop: React.FC<ScratchTicketShopProps> = ({ 
  tickets, 
  title = "Daily Shop", 
  subtitle = "New tickets available every day. Get yours now!",
  onPurchase
}) => {
  const { data: session, isPending } = authClient.useSession();
  const user = session?.user || null;
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<ScratchTicket | null>(null);
  const [shopTickets, setShopTickets] = useState<ScratchTicket[]>(tickets);

  // Function to check which tickets the user has already purchased
  const checkPurchasedTickets = async () => {
    if (!user) return;

    try {
      // Fetch user's purchased tickets - include both scratched and unscratched tickets
      const response = await fetch('/api/users/scratch-tickets?includeScratched=true', {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.tickets && Array.isArray(data.tickets)) {
          // Get the ticket IDs that the user has already purchased (using ticketId not ticket.id)
          const purchasedTicketIds = new Set();
          
          // Track both ticket.id (for shop tickets) and ticketId (referencing ScratchTicket)
          data.tickets.forEach((t: any) => {
            if (t.ticket?.id) purchasedTicketIds.add(t.ticket.id);
            if (t.ticketId) purchasedTicketIds.add(t.ticketId);
          });
          
          // Update shop tickets with purchased status
          setShopTickets(prev => 
            prev.map(ticket => ({
              ...ticket,
              purchased: purchasedTicketIds.has(ticket.id)
            }))
          );
        }
      }
    } catch (error) {
      console.error('Error checking purchased tickets:', error);
    }
  };

  // Mark any purchased tickets when component loads or tickets change
  useEffect(() => {
    setShopTickets(tickets);
    if (user) {
      checkPurchasedTickets();
    }
  }, [tickets, user]);

  // Listen for ticket updates from other components
  useEffect(() => {
    const handleStorageChange = () => {
      checkPurchasedTickets();
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('tickets-updated', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('tickets-updated', handleStorageChange);
    };
  }, [user]);

  if (!shopTickets || !Array.isArray(shopTickets)) {
    return <p className="text-white">No scratch tickets available.</p>;
  }

  async function buyTicket(ticketId: string) {
    setLoading(true);
    setError(null);
    
    try {
      // Find the ticket in the shop
      const ticketToBuy = shopTickets.find(t => t.id === ticketId);
      
      if (!ticketToBuy) {
        throw new Error("Ticket not found in shop");
      }
      
      // Double check if the ticket is already purchased
      if (ticketToBuy.purchased) {
        setSelectedTicket(null);
        return; // Silently return without showing error toast
      }
      
      // Set a timeout to prevent indefinite loading state
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Request timed out. Please try again.")), 10000);
      });
      
      // Attempt to purchase the ticket
      const fetchPromise = fetch(`/api/users/scratch-tickets?id=${ticketId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          price: ticketToBuy.price,
          type: ticketToBuy.type,
          name: ticketToBuy.name
        })
      });
      
      // Race between the fetch and the timeout
      const response = await Promise.race([fetchPromise, timeoutPromise]) as Response;

      // Check if response is ok
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        console.error("Error response:", errorData);
        throw new Error(errorData.error || `Server error (${response.status})`);
      }

      const data = await response.json().catch(() => ({ error: "Failed to parse response" }));
      
      if (data.error) {
        throw new Error(data.error);
      }

      // Check if the API returned an "already own" message - in this case, just close silently
      if (data.message && data.message.includes("already own")) {
        // Mark the ticket as purchased in the shop without showing a toast
        const updatedTickets = shopTickets.map(ticket => 
          ticket.id === ticketId ? { ...ticket, purchased: true } : ticket
        );
        setShopTickets(updatedTickets);
        setSelectedTicket(null);
        return;
      }

      // Mark the ticket as purchased in the shop
      const updatedTickets = shopTickets.map(ticket => 
        ticket.id === ticketId ? { ...ticket, purchased: true } : ticket
      );
      setShopTickets(updatedTickets);

      // Pass the purchased ticket to the parent component
      const purchasedTicket = updatedTickets.find(ticket => ticket.id === ticketId);
      if (purchasedTicket && onPurchase) {
        onPurchase(purchasedTicket);
      }

      toast({
        title: "Success!",
        description: `You purchased a ${purchasedTicket?.name || "scratch ticket"}!`,
      });

      // Notify other components about the purchase
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('tickets-updated', Date.now().toString());
        // Trigger both storage event and custom event
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'tickets-updated',
          newValue: Date.now().toString()
        }));
        window.dispatchEvent(new CustomEvent('tickets-updated'));
      }

      setSelectedTicket(null);
    } catch (error: any) {
      console.error("Error buying scratch ticket:", error);
      setError(error.message);

      // Only show error toast for actual errors, not for "already purchased" conditions
      if (error.message && !error.message.includes("already purchased")) {
        toast({
          title: "Error",
          description: error.message || "Failed to purchase ticket",
        });
      }
    } finally {
      setLoading(false);
    }
  }

  const handlePurchaseClick = (ticket: ScratchTicket) => {
    // Close ticket details modal
    setSelectedTicket(null);
    
    // Call parent handler for purchase
    onPurchase?.(ticket);
    
    // Scroll to the My Tickets section after a short delay
    setTimeout(() => {
      const myTicketsSection = document.getElementById('my-tickets-section');
      if (myTicketsSection) {
        myTicketsSection.scrollIntoView({ behavior: 'smooth' });
      }
    }, 1000); // Give API a second to complete
  };

  return (
    <div className="w-full bg-gray-800 p-6">
      <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
      <p className="text-gray-400 mb-6">{subtitle}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {shopTickets.map((ticket) => (
          <div key={ticket.id} onClick={() => !ticket.purchased && setSelectedTicket(ticket)}>
            <ScratchTicketTile key={ticket.id} ticket={ticket} />
            {ticket.purchased && (
              <div className="mt-2 bg-gray-700 text-gray-300 text-center py-1 rounded-md text-sm font-medium">
                Purchased
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Ticket details modal */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4 z-50 backdrop-blur-sm" onClick={() => setSelectedTicket(null)}>
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 max-w-md w-full shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="mb-4">
              <div className={`relative h-32 bg-gradient-to-br ${
                selectedTicket.type === 'tokens' ? 'from-yellow-600 to-yellow-300' :
                selectedTicket.type === 'money' ? 'from-green-600 to-green-300' :
                selectedTicket.type === 'stocks' ? 'from-blue-600 to-blue-300' :
                selectedTicket.type === 'random' ? 'from-purple-600 to-purple-300' :
                'from-pink-600 to-pink-300'
              } rounded-lg mb-4 flex items-center justify-center`}>
                <div className="absolute inset-0 opacity-25 bg-pattern-dots"></div>
                <div className="z-10 text-center">
                  <div className="text-white font-bold text-2xl">{selectedTicket.name}</div>
                </div>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-white mb-4">{selectedTicket.name}</h2>

            <p className="text-gray-300 mb-6">{selectedTicket.description}</p>

            {error && <p className="text-red-500 text-center mb-4">{error}</p>}

            <div className="flex justify-between items-center">
              <div>
                <span className="text-gray-400 text-sm">Price:</span>
                <span className="text-2xl font-bold text-green-400 ml-2">{selectedTicket.price} tokens</span>
              </div>
              <div className="flex gap-3">
                <button
                  className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded font-medium"
                  onClick={() => setSelectedTicket(null)}
                  disabled={loading}
                >
                  Close
                </button>
                {user && (
                  <button
                    onClick={() => selectedTicket && buyTicket(selectedTicket.id)}
                    className={`px-4 py-2 rounded font-medium text-white ${
                      loading || (selectedTicket && selectedTicket.purchased)
                        ? 'bg-gray-500 cursor-not-allowed' 
                        : selectedTicket.type === 'tokens' 
                          ? 'bg-yellow-500 hover:bg-yellow-600' 
                          : selectedTicket.type === 'money'
                          ? 'bg-green-500 hover:bg-green-600'
                          : selectedTicket.type === 'stocks'
                          ? 'bg-blue-500 hover:bg-blue-600'
                          : selectedTicket.type === 'random'
                          ? 'bg-purple-500 hover:bg-purple-600'
                          : 'bg-pink-500 hover:bg-pink-600'
                    }`}
                    disabled={loading || (selectedTicket && selectedTicket.purchased)}
                  >
                    {loading ? "Buying..." : selectedTicket.purchased ? "Purchased" : "Buy Ticket"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScratchTicketShop; 