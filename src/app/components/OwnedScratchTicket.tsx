"use client";

import React from "react";
import { getTicketTypeStyles, ScratchTicket } from "./ScratchTicketTile";

// Define ScratchTicketType since we can't import from Prisma directly in client components
type ScratchTicketType = 'tokens' | 'money' | 'stocks' | 'random' | 'diamond';

export interface UserScratchTicket {
  id: string;
  ticketId: string;
  userId: string;
  purchased: boolean;
  scratched: boolean;
  createdAt: string;
  scratchedAt?: string;
  isBonus?: boolean;
  dayKey: string;
  shopTicketId?: string; // ID of the ticket in the daily shop UI (for purchase tracking)
  prizeTokens?: number;
  prizeCash?: number;
  prizeStocks?: number;
  prizeStockShares?: any;
  ticket: {
    id: string;
    name: string;
    type: ScratchTicketType;
    price: number;
    description?: string;
    isDailyShop?: boolean;
    dayKey?: string;
  };
}

interface OwnedScratchTicketProps {
  userTicket: UserScratchTicket;
  onClick?: () => void;
}

const OwnedScratchTicket: React.FC<OwnedScratchTicketProps> = ({ userTicket, onClick }) => {
  const { ticket } = userTicket;
  const styles = getTicketTypeStyles(ticket.type);

  return (
    <div
      className={`relative bg-gray-800 border border-gray-700 hover:border-${styles.textColor} rounded-lg overflow-hidden cursor-pointer transform hover:scale-105 transition-all duration-200`}
      onClick={onClick}
    >
      {/* Ticket top part with gradient background */}
      <div className={`relative h-32 bg-gradient-to-br ${styles.gradientFrom} ${styles.gradientTo} p-4 flex items-center justify-center`}>
        <div className="absolute inset-0 opacity-25 bg-pattern-dots"></div>
        <div className="z-10 text-center">
          <div className="text-white font-bold text-xl mb-1">{ticket.name}</div>
          <div className="flex items-center justify-center bg-black bg-opacity-40 px-3 py-1 rounded-full">
            {styles.icon}
            <span className="ml-2 text-white text-sm font-medium">{styles.name} Ticket</span>
          </div>
        </div>
      </div>

      {/* Ticket info */}
      <div className="p-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center">
            <span className="text-gray-400 text-sm">Purchased on {new Date(userTicket.createdAt).toLocaleDateString()}</span>
          </div>
          <div 
            className={`w-full py-2 rounded-lg text-sm font-medium ${styles.bgColor} text-white hover:bg-opacity-90 transition-colors flex items-center justify-center`}
          >
            {userTicket.scratched ? "View Ticket" : "Play Now"}
          </div>
        </div>
      </div>

      {/* Bonus badge for bonus tickets */}
      {userTicket.isBonus && (
        <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded-full">
          Bonus - 25% Higher Reward
        </div>
      )}
      {/* Unscratched overlay moved to top-left */}
      {!userTicket.scratched && (
        <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
          New
        </div>
      )}
    </div>
  );
};

export default OwnedScratchTicket; 