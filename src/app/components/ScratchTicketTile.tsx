"use client";

import React from "react";
import Image from "next/image";
import { FaCoins, FaMoneyBillWave, FaChartLine, FaRandom, FaGem } from "react-icons/fa";

export type TicketType = "tokens" | "money" | "stocks" | "random" | "diamond";

export interface ScratchTicket {
  id: string;
  name: string;
  price: number;
  type: TicketType;
  description: string;
  createdAt: string;
  purchased?: boolean; // Track if ticket is purchased
  isBonus?: boolean;   // Track if ticket is a bonus variant
}

interface ScratchTicketTileProps {
  ticket: ScratchTicket;
  onClick?: () => void;
}

// Function to get ticket type styles
export function getTicketTypeStyles(type: TicketType) {
  switch (type) {
    case "tokens":
      return {
        bgColor: "bg-yellow-500",
        gradientFrom: "from-yellow-600",
        gradientTo: "to-yellow-300",
        textColor: "text-yellow-500",
        borderColor: "border-yellow-500",
        name: "Tokens",
        icon: <FaCoins className="text-yellow-400" />
      };
    case "money":
      return {
        bgColor: "bg-green-500",
        gradientFrom: "from-green-600",
        gradientTo: "to-green-300",
        textColor: "text-green-500",
        borderColor: "border-green-500",
        name: "Cash",
        icon: <FaMoneyBillWave className="text-green-400" />
      };
    case "stocks":
      return {
        bgColor: "bg-blue-500",
        gradientFrom: "from-blue-600",
        gradientTo: "to-blue-300",
        textColor: "text-blue-500",
        borderColor: "border-blue-500",
        name: "Stocks",
        icon: <FaChartLine className="text-blue-400" />
      };
    case "random":
      return {
        bgColor: "bg-purple-500",
        gradientFrom: "from-purple-600",
        gradientTo: "to-purple-300",
        textColor: "text-purple-500",
        borderColor: "border-purple-500",
        name: "Random",
        icon: <FaRandom className="text-purple-400" />
      };
    case "diamond":
      return {
        bgColor: "bg-pink-500",
        gradientFrom: "from-pink-600",
        gradientTo: "to-pink-300",
        textColor: "text-pink-500",
        borderColor: "border-pink-500",
        name: "Diamond",
        icon: <FaGem className="text-pink-400" />
      };
    default:
      return {
        bgColor: "bg-gray-500",
        gradientFrom: "from-gray-600",
        gradientTo: "to-gray-300",
        textColor: "text-gray-500",
        borderColor: "border-gray-500",
        name: "Unknown",
        icon: <FaRandom className="text-gray-400" />
      };
  }
}

const ScratchTicketTile: React.FC<ScratchTicketTileProps> = ({ ticket, onClick }) => {
  const styles = getTicketTypeStyles(ticket.type);

  return (
    <div
      className={`relative bg-gray-800 border border-gray-700 hover:border-${styles.textColor} rounded-lg overflow-hidden cursor-pointer transform hover:scale-105 transition-all duration-200 ${ticket.purchased ? 'opacity-50 cursor-default' : ''}`}
      onClick={ticket.purchased ? undefined : onClick}
    >
      {/* Ticket top part with gradient background */}
      <div className={`relative h-32 bg-gradient-to-br ${styles.gradientFrom} ${styles.gradientTo} p-4 flex items-center justify-center`}>
        <div className="absolute inset-0 opacity-25 bg-pattern-dots"></div>
        {ticket.isBonus && (
          <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded-full">
            Bonus - 25% Higher Reward
          </div>
        )}
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
        <p className="text-gray-400 text-sm mb-4 h-12 overflow-hidden">{ticket.description}</p>
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <span className="text-green-400 font-bold">{ticket.price} tokens</span>
          </div>
          <div 
            className={`px-4 py-1.5 rounded-full text-sm font-medium ${ticket.purchased ? 'bg-gray-600 text-gray-300' : `${styles.bgColor} text-white hover:bg-opacity-90`} transition-colors`}
          >
            {ticket.purchased ? 'Purchased' : 'Buy Now'}
          </div>
        </div>
      </div>

      {/* Purchased overlay - improved to be more visible and persistent */}
      {ticket.purchased && (
        <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center z-20">
          <div className="bg-gray-800 border-2 border-gray-600 text-white px-4 py-2 rounded-lg font-bold shadow-lg">
            Purchased
          </div>
        </div>
      )}
    </div>
  );
};

export default ScratchTicketTile; 