import { NextResponse } from "next/server";
import { ScratchTicket } from "@/app/components/ScratchTicketTile";

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
  console.log('[API DAILY-SHOP] Generating a new shop');
  
  // Create a daily seed based on the current date for consistent shop across users
  const now = new Date();
  const seed = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
  const seededRandom = createSeededRandom(seed);
  
  // Define all possible ticket types
  const ticketTypes = [
    {
      type: "tokens" as const,
      name: "Golden Fortune",
      price: 25,
      description: "Win tokens! Try your luck with this golden ticket.",
      // Diamond is 1%, others are 24.75% each
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
      description: "1% Chance of appearing, win anything with a 300x multiplier! The ultimate premium ticket!",
      chance: 1,
    }
  ];
  
  // Verify that probabilities sum to 100%
  const totalChance = ticketTypes.reduce((sum, type) => sum + type.chance, 0);
  console.log(`[API DAILY-SHOP] Total chance: ${totalChance}%`); // Should be 100%
  
  // HARD-CODE THE SHOP SIZE TO ENSURE CONSISTENCY
  const TOTAL_SHOP_SLOTS = 12;
  console.log(`[API DAILY-SHOP] Creating shop with ${TOTAL_SHOP_SLOTS} tickets`);
  
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
    
    const bonusDescription = isBonus 
      ? `Another chance to win with a ${selectedTicketType.type} ticket! 25% Higher Reward!`
      : selectedTicketType.description;
    
    shopTickets.push({
      id: `${selectedTicketType.type}${isBonus ? '-bonus' : ''}-${generateUUID()}`,
      name: selectedTicketType.name,
      price: selectedTicketType.price,
      type: selectedTicketType.type,
      description: isBonus ? bonusDescription : selectedTicketType.description,
      createdAt: new Date().toISOString(),
      isBonus
    });
  }
  
  // Verify the length of the shop
  console.log(`[API DAILY-SHOP] Generated ${shopTickets.length} tickets`);
  
  // Log the distribution of tickets for verification
  const distribution = shopTickets.reduce((acc: any, ticket) => {
    acc[ticket.type] = (acc[ticket.type] || 0) + 1;
    return acc;
  }, {});
  
  console.log('[API DAILY-SHOP] Distribution:', distribution);
  console.log('[API DAILY-SHOP] Bonus tickets:', shopTickets.filter(t => t.isBonus).length);
  
  // Ensure the shop has EXACTLY the right number of tickets
  if (shopTickets.length !== TOTAL_SHOP_SLOTS) {
    console.warn(`[API DAILY-SHOP] Wrong number of tickets: ${shopTickets.length}, fixing...`);
    
    // If we have too many, remove extras
    if (shopTickets.length > TOTAL_SHOP_SLOTS) {
      shopTickets.splice(TOTAL_SHOP_SLOTS);
    }
    
    // If we have too few, add more of the default token tickets
    while (shopTickets.length < TOTAL_SHOP_SLOTS) {
      shopTickets.push({
        id: `tokens-${generateUUID()}`,
        name: "Golden Fortune",
        price: 25,
        type: "tokens",
        description: "Win tokens! Try your luck with this golden ticket.",
        createdAt: new Date().toISOString(),
        isBonus: false
      });
    }
    
    console.log(`[API DAILY-SHOP] Fixed shop size: ${shopTickets.length}`);
  }
  
  return shopTickets;
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