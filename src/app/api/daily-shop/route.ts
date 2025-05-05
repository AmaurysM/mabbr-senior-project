import { NextResponse } from "next/server";
import { ScratchTicket } from "@/app/components/ScratchTicketTile";
import seedrandom from 'seedrandom';
import crypto from 'crypto';

// Define the ticket types enum since it's not available from Prisma
type ScratchTicketType = 'tokens' | 'money' | 'stocks' | 'random' | 'diamond';

// Get the day key for storing daily shop
function getDayKey() {
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
}

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
function generateDailyShop(): ScratchTicket[] {
  const today = new Date();
  const dayKey = today.toISOString().split('T')[0]; // YYYY-MM-DD format
  const seed = dayKey; // Use the day as seed for consistent generation
  
  // Initialize random number generator with seed
  const rng = seedrandom(seed);
  
  const shopSize = 12; // Generate all 12 tickets with the same mechanism
  const tickets: ScratchTicket[] = [];
  
  // Define ticket types and their chances (total must sum to 100)
  const ticketTypes = [
    { type: 'tokens' as ScratchTicketType, price: 25, chance: 40, description: 'Win tokens! Try your luck with this golden ticket.' },
    { type: 'money' as ScratchTicketType, price: 50, chance: 30, description: 'Win cash! This green ticket could turn into real money.' },
    { type: 'stocks' as ScratchTicketType, price: 75, chance: 15, description: 'Win shares! Get a piece of the market with this blue ticket.' },
    { type: 'random' as ScratchTicketType, price: 100, chance: 10, description: 'Win anything with a 10x multiplier! High risk but incredible rewards if you hit!' },
    { type: 'diamond' as ScratchTicketType, price: 200, chance: 5, description: 'ULTRA RARE - 1% CHANCE TO APPEAR! Win anything with a 50x multiplier!' }
  ];
  
  // Generate exactly 12 regular tickets
  for (let i = 0; i < shopSize; i++) {
    const roll = rng() * 100; // Roll 0-100
    let cumulative = 0;
    let selectedType;
    
    for (const type of ticketTypes) {
      cumulative += type.chance;
      if (roll < cumulative) {
        selectedType = type;
        break;
      }
    }
    
    // Generate a deterministic ID based on the day and position
    const ticketId = crypto.createHash('md5')
      .update(`${dayKey}-${i}-${selectedType?.type}`)
      .digest('hex');
    
    // Determine if this is a bonus ticket (25% chance)
    const isBonus = rng() < 0.25;
    
    // Use more consistent ticket names based on the client implementation
    let ticketName = "Scratch Ticket";
    switch(selectedType?.type) {
      case 'tokens':
        ticketName = "Golden Fortune";
        break;
      case 'money':
        ticketName = "Cash Splash";
        break;
      case 'stocks':
        ticketName = "Stock Surge";
        break;
      case 'random':
        ticketName = "Mystic Chance";
        break;
      case 'diamond':
        ticketName = "Diamond Scratch";
        break;
    }
    
    tickets.push({
      id: ticketId,
      type: selectedType?.type || 'tokens',
      price: selectedType?.price || 25,
      name: ticketName,
      description: selectedType?.description || 'A basic scratch ticket',
      isBonus: isBonus,
      dayKey,
      createdAt: new Date()
    });
  }
  
  return tickets;
}

// GET /api/daily-shop
// Get the daily scratch ticket shop that's consistent for all users
export async function GET() {
  try {
    console.log('[API DAILY-SHOP] GET request received');
    
    // Generate the daily shop data based on today's date
    const shopTickets = generateDailyShop();
    
    const dayKey = getDayKey();
    console.log(`[API DAILY-SHOP] Returning shop for day: ${dayKey} with ${shopTickets.length} tickets`);
    
    // Return the shop tickets
    return NextResponse.json({
      dayKey: dayKey,
      tickets: shopTickets
    });
  } catch (error) {
    console.error("[API DAILY-SHOP] Error generating daily shop:", error);
    return NextResponse.json(
      { error: "Failed to generate daily shop" },
      { status: 500 }
    );
  }
} 