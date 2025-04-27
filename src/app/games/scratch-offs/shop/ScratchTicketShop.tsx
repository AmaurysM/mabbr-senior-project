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

  // Mark any purchased tickets
  useEffect(() => {
    setShopTickets(tickets);
  }, [tickets]);

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
      
      const response = await fetch(`/api/users/scratch-tickets?id=${ticketId}`, {
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

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Purchase failed");

      // Mark the ticket as purchased in the shop
      const updatedTickets = shopTickets.map(ticket => 
        ticket.id === ticketId ? { ...ticket, purchased: true } : ticket
      );
      setShopTickets(updatedTickets);

      // Pass the purchased ticket to the parent component
      const purchasedTicket = shopTickets.find(ticket => ticket.id === ticketId);
      if (purchasedTicket && onPurchase) {
        onPurchase(purchasedTicket);
      }

      toast({
        title: "Success!",
        description: `You purchased a ${selectedTicket?.name || "scratch ticket"}!`,
      });

      setSelectedTicket(null); 
    } catch (error: any) {
      console.error("Error buying scratch ticket:", error);
      setError(error.message);

      toast({
        title: "Error",
        description: error.message || "Failed to purchase ticket",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full bg-gray-800 p-6">
      <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
      <p className="text-gray-400 mb-6">{subtitle}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {shopTickets.map((ticket) => (
          <div key={ticket.id} onClick={() => !ticket.purchased && setSelectedTicket(ticket)}>
            <ScratchTicketTile key={ticket.id} ticket={ticket} />
          </div>
        ))}
      </div>

      {/* Ticket details modal */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4 z-50 backdrop-blur-sm" onClick={() => setSelectedTicket(null)}>
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 max-w-md w-full shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="mb-4">
              <div className={`relative h-32 bg-gradient-to-br from-${selectedTicket.type === 'tokens' ? 'yellow' : selectedTicket.type === 'money' ? 'green' : selectedTicket.type === 'stocks' ? 'blue' : selectedTicket.type === 'random' ? 'purple' : 'pink'}-600 to-${selectedTicket.type === 'tokens' ? 'yellow' : selectedTicket.type === 'money' ? 'green' : selectedTicket.type === 'stocks' ? 'blue' : selectedTicket.type === 'random' ? 'purple' : 'pink'}-300 rounded-lg mb-4 flex items-center justify-center`}>
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
                    className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded font-medium"
                    onClick={() => buyTicket(selectedTicket.id)}
                    disabled={loading || selectedTicket.purchased}
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