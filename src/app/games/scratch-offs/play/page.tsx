"use client";

import React, { useEffect, useState, useRef, Suspense, FunctionComponent } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import LoadingStateAnimation from "@/app/components/LoadingState";
import { getTicketTypeStyles } from "@/app/components/ScratchTicketTile";
import { UserScratchTicket } from "@/app/components/OwnedScratchTicket";
import { useToast } from "@/app/hooks/use-toast";
import { authClient } from "@/lib/auth-client";
import confetti from 'canvas-confetti';
import { FaCoins, FaChartLine, FaMoneyBillWave, FaGem, FaStar, FaTimes } from "react-icons/fa";

// Modified SymbolType to include stock symbols and cash amounts
type SymbolType = 
  | 'token' | 'stock' | 'cash' 
  | 'multiplier2x' | 'multiplier10x' | 'empty' 
  | 'stock_AAPL' | 'stock_MSFT' | 'stock_GOOG' | 'stock_AMZN' | 'stock_META' | 'stock_TSLA' 
  | 'stock_NFLX' | 'stock_NVDA' | 'stock_JPM' | 'stock_V' | 'stock_WMT' | 'stock_DIS' 
  | 'cash_5' | 'cash_10' | 'cash_25' | 'cash_50' | 'cash_100' | 'cash_500' | 'cash_1000'
  | 'token_5' | 'token_10' | 'token_25' | 'token_50' | 'token_100' | 'token_500' | 'token_1000';

interface Symbol {
  type: SymbolType;
  icon: React.ReactNode;
  color: string;
  value: number;
}

interface ScratchCell {
  id: number;
  symbol: Symbol;
  scratched: boolean;
}

// Popular stock symbols with their values - expanded list
const STOCK_SYMBOLS: { symbol: string; value: number; fullName: string }[] = [
  { symbol: 'AAPL', value: 180, fullName: 'Apple Inc.' },
  { symbol: 'MSFT', value: 350, fullName: 'Microsoft Corp.' },
  { symbol: 'GOOG', value: 130, fullName: 'Alphabet Inc.' },
  { symbol: 'AMZN', value: 145, fullName: 'Amazon.com Inc.' },
  { symbol: 'TSLA', value: 250, fullName: 'Tesla Inc.' },
  { symbol: 'META', value: 290, fullName: 'Meta Platforms Inc.' },
  { symbol: 'NVDA', value: 400, fullName: 'NVIDIA Corp.' },
  { symbol: 'JPM', value: 145, fullName: 'JPMorgan Chase & Co.' },
  { symbol: 'V', value: 230, fullName: 'Visa Inc.' },
  { symbol: 'WMT', value: 60, fullName: 'Walmart Inc.' },
  { symbol: 'JNJ', value: 155, fullName: 'Johnson & Johnson' },
  { symbol: 'PG', value: 145, fullName: 'Procter & Gamble Co.' },
  { symbol: 'MA', value: 380, fullName: 'Mastercard Inc.' },
  { symbol: 'UNH', value: 480, fullName: 'UnitedHealth Group Inc.' },
  { symbol: 'HD', value: 330, fullName: 'Home Depot Inc.' }
];

// Cash amounts for money scratch-offs
const CASH_AMOUNTS = [50, 500, 1000, 5000, 10000];

// Token amounts for token scratch-offs
const TOKEN_AMOUNTS = [10, 50, 100, 500, 1000];

// Base symbols
const baseSymbols = {
  token: {
    type: 'token' as SymbolType,
    icon: React.createElement(FaCoins, { className: "text-3xl" }),
    color: 'text-yellow-400',
    value: 1,
  },
  stock: {
    type: 'stock' as SymbolType,
    icon: React.createElement(FaChartLine, { className: "text-3xl" }),
    color: 'text-blue-400',
    value: 1,
  },
  cash: {
    type: 'cash' as SymbolType,
    icon: React.createElement(FaMoneyBillWave, { className: "text-3xl" }),
    color: 'text-green-400',
    value: 1,
  },
  multiplier2x: {
    type: 'multiplier2x' as SymbolType,
    icon: React.createElement('span', { className: "text-2xl font-bold" }, "2x"),
    color: 'text-orange-400',
    value: 2,
  },
  multiplier10x: {
    type: 'multiplier10x' as SymbolType,
    icon: React.createElement('span', { className: "text-2xl font-bold" }, "10x"),
    color: 'text-red-500',
    value: 10,
  },
  empty: {
    type: 'empty' as SymbolType,
    icon: null,
    color: 'text-gray-500',
    value: 0,
  }
};

// Stock symbols
const stockSymbols: Record<string, Symbol> = {};
STOCK_SYMBOLS.forEach(stock => {
  stockSymbols[`stock_${stock.symbol}`] = {
    type: `stock_${stock.symbol}` as SymbolType,
    icon: React.createElement('span', { className: "text-xl font-bold" }, stock.symbol),
    color: 'text-blue-400',
    value: stock.value
  };
});

// Cash amount symbols
const cashSymbols: Record<string, Symbol> = {};
CASH_AMOUNTS.forEach(amount => {
  cashSymbols[`cash_${amount}`] = {
    type: `cash_${amount}` as SymbolType,
    icon: React.createElement('span', { className: "text-xl font-bold" }, `$${amount}`),
    color: 'text-green-400',
    value: amount
  };
});

// Token amount symbols with different icons based on amount
const tokenSymbols: Record<string, Symbol> = {};
TOKEN_AMOUNTS.forEach((amount, index) => {
  let icon;
  if (amount <= 10) {
    icon = React.createElement(FaCoins, { className: "text-2xl" });
  } else if (amount <= 100) {
    icon = React.createElement('div', { className: "flex" }, 
      React.createElement(FaCoins, { className: "text-2xl" }),
      React.createElement(FaCoins, { className: "text-2xl ml-1" })
    );
  } else if (amount <= 500) {
    icon = React.createElement('div', { className: "flex flex-col items-center" },
      React.createElement('div', { className: "flex" },
        React.createElement(FaCoins, { className: "text-xl" }),
        React.createElement(FaCoins, { className: "text-xl ml-0.5" })
      ),
      React.createElement('div', { className: "flex mt-0.5" },
        React.createElement(FaCoins, { className: "text-xl" }),
        React.createElement(FaCoins, { className: "text-xl ml-0.5" })
      )
    );
  } else {
    // Use a money bag icon for the largest amount
    icon = React.createElement(FaGem, { className: "text-3xl" });
  }
  
  tokenSymbols[`token_${amount}`] = {
    type: `token_${amount}` as SymbolType,
    icon: React.createElement('div', { className: "flex flex-col items-center" },
      icon,
      React.createElement('span', { className: "text-xs font-bold mt-1" }, amount.toString())
    ),
    color: 'text-yellow-400',
    value: amount
  };
});

// Combine all symbols
const SYMBOLS = {
  ...baseSymbols,
  ...stockSymbols,
  ...cashSymbols,
  ...tokenSymbols
} as unknown as Record<SymbolType, Symbol>;

// Function to generate a random symbol based on probabilities and ticket type
const getRandomSymbol = (ticketType: string, isBonus: boolean = false): Symbol => {
  const rng = Math.random() * 100;
  
  // For token tickets, select from token amounts
  if (ticketType === 'tokens') {
    // Probabilities for token amounts (decreasing for higher values)
    let tokenProbs: Record<string, number> = {
      'token_10': 25,
      'token_50': 15,
      'token_100': 8,
      'token_500': 4,
      'token_1000': 2,
      'multiplier2x': 10,
      'multiplier10x': 1,
      'empty': 35
    };
    
    // Increase chances in bonus tickets
    if (isBonus) {
      tokenProbs['token_10'] += 3;
      tokenProbs['token_50'] += 3;
      tokenProbs['token_100'] += 2;
      tokenProbs['token_500'] += 1;
      tokenProbs['multiplier2x'] += 5;
      tokenProbs['empty'] -= 14;
    }
    
    // Select based on cumulative probability
    let cumulative = 0;
    for (const [key, prob] of Object.entries(tokenProbs)) {
      cumulative += prob;
      if (rng <= cumulative) {
        return SYMBOLS[key as SymbolType];
      }
    }
    
    return SYMBOLS.empty;
  }
  
  // For stock tickets, select from stock symbols
  if (ticketType === 'stocks') {
    // Sort stocks by price first to prioritize cheaper ones
    const sortedStocks = [...STOCK_SYMBOLS].sort((a, b) => a.value - b.value);
    
    // Select more stocks for higher chances to win
    // First 4 are cheaper stocks (increased probability for easier wins)
    const selectedStocks = sortedStocks.slice(0, 4);
    
    // Assign colors to stocks for this ticket
    const stockColors = [
      'text-blue-400', 
      'text-purple-400', 
      'text-indigo-400'
    ];
    
    // Probabilities for stock ticket - higher probabilities for cheaper stocks
    let stockProbs: Record<string, number> = {
      // Selected stocks - cheaper stocks get higher probability
      [`stock_${selectedStocks[0].symbol}`]: 20, // Cheapest stock
      [`stock_${selectedStocks[1].symbol}`]: 16, // Second cheapest
      [`stock_${selectedStocks[2].symbol}`]: 12, // Third cheapest
      [`stock_${selectedStocks[3].symbol}`]: 8,  // Fourth cheapest
      // Multipliers
      'multiplier2x': 10,
      'multiplier10x': 1,
      // Empty space - reduced to increase win chances
      'empty': 33
    };
    
    // Increase chances in bonus tickets
    if (isBonus) {
      stockProbs[`stock_${selectedStocks[0].symbol}`] += 6;
      stockProbs[`stock_${selectedStocks[1].symbol}`] += 5;
      stockProbs[`stock_${selectedStocks[2].symbol}`] += 4;
      stockProbs[`stock_${selectedStocks[3].symbol}`] += 3;
      stockProbs['multiplier2x'] += 5;
      stockProbs['empty'] -= 23;
    }
    
    // Randomly assign colors to stocks for this ticket
    const tempSymbols = { ...SYMBOLS } as Record<string, Symbol>;
    selectedStocks.forEach((stock, index) => {
      const colorIndex = Math.floor(Math.random() * stockColors.length);
      const color = stockColors[colorIndex];
      
      // Create a temporary version of the symbol with a custom color
      const key = `stock_${stock.symbol}` as string;
      tempSymbols[key] = {
        ...tempSymbols[key],
        color: color
      };
    });
    
    // Select based on cumulative probability
    let cumulative = 0;
    for (const [key, prob] of Object.entries(stockProbs)) {
      cumulative += prob;
      if (rng <= cumulative) {
        // Use the custom colored version if it's a stock
        return tempSymbols[key as SymbolType];
      }
    }
    
    return SYMBOLS.empty;
  }
  
  // For cash tickets, select from cash amounts
  if (ticketType === 'money') {
    // Probabilities for cash amounts (decreasing for higher values)
    let cashProbs: Record<string, number> = {
      'cash_50': 25,
      'cash_500': 12,
      'cash_1000': 6,
      'cash_5000': 3,
      'cash_10000': 1,
      'multiplier2x': 10,
      'multiplier10x': 1,
      'empty': 42
    };
    
    // Increase chances in bonus tickets
    if (isBonus) {
      cashProbs['cash_50'] += 5;
      cashProbs['cash_500'] += 5;
      cashProbs['cash_1000'] += 2;
      cashProbs['multiplier2x'] += 5;
      cashProbs['empty'] -= 17;
    }
    
    // Select based on cumulative probability
    let cumulative = 0;
    for (const [key, prob] of Object.entries(cashProbs)) {
      cumulative += prob;
      if (rng <= cumulative) {
        return SYMBOLS[key as SymbolType];
      }
    }
    
    return SYMBOLS.empty;
  }
  
  // For random tickets (Mystic Chance), use a mix of all symbol types but make them rare
  if (ticketType === 'random') {
    // Combine all symbol types with very low probabilities (high difficulty)
    let randomProbs: Record<string, number> = {
      // Token symbols (rare)
      'token_10': 2,
      'token_50': 2,
      'token_100': 2,
      'token_500': 1,
      'token_1000': 1,
      // Cash symbols (rare)
      'cash_50': 2,
      'cash_500': 2,
      'cash_1000': 1,
      'cash_5000': 0.5,
      'cash_10000': 0.5,
      // Stock symbols (rare) - pick some random ones
      'stock_AAPL': 1,
      'stock_MSFT': 1,
      'stock_AMZN': 1,
      'stock_TSLA': 1,
      // Multipliers (still relatively rare)
      'multiplier2x': 3,
      'multiplier10x': 1,
      // Mostly empty spaces
      'empty': 78
    };
    
    // Increase chances slightly in bonus tickets
    if (isBonus) {
      Object.keys(randomProbs).forEach(key => {
        if (key !== 'empty') {
          randomProbs[key] += 0.5;
        }
      });
      randomProbs['empty'] -= 10;
    }
    
    // Select based on cumulative probability
    let cumulative = 0;
    for (const [key, prob] of Object.entries(randomProbs)) {
      cumulative += prob;
      if (rng <= cumulative) {
        return SYMBOLS[key as SymbolType];
      }
    }
    
    return SYMBOLS.empty;
  }
  
  // For diamond tickets, similar to random but with slightly better odds
  if (ticketType === 'diamond') {
    // Combine all symbol types with low probabilities (but better than Mystic Chance)
    let diamondProbs: Record<string, number> = {
      // Token symbols (better chances than random)
      'token_10': 3,
      'token_50': 3,
      'token_100': 3,
      'token_500': 2,
      'token_1000': 2,
      // Cash symbols (better chances than random)
      'cash_50': 3,
      'cash_500': 3,
      'cash_1000': 2,
      'cash_5000': 1,
      'cash_10000': 1,
      // Stock symbols (better chances than random)
      'stock_AAPL': 2,
      'stock_MSFT': 2,
      'stock_AMZN': 2,
      'stock_TSLA': 2,
      // Multipliers (more common)
      'multiplier2x': 5,
      'multiplier10x': 2,
      // Still mostly empty, but less than Mystic Chance
      'empty': 62
    };
    
    // Increase chances further in bonus tickets
    if (isBonus) {
      Object.keys(diamondProbs).forEach(key => {
        if (key !== 'empty') {
          diamondProbs[key] += 1;
        }
      });
      diamondProbs['empty'] -= 15;
    }
    
    // Select based on cumulative probability
    let cumulative = 0;
    for (const [key, prob] of Object.entries(diamondProbs)) {
      cumulative += prob;
      if (rng <= cumulative) {
        return SYMBOLS[key as SymbolType];
      }
    }
    
    return SYMBOLS.empty;
  }
  
  // Default to empty for any other ticket type
  return SYMBOLS.empty;
};

// Generate a random 5x5 grid
const generateGrid = (ticketType: string, isBonus: boolean = false): ScratchCell[] => {
  const grid: ScratchCell[] = [];
  
  for (let i = 0; i < 25; i++) {
    grid.push({
      id: i,
      symbol: getRandomSymbol(ticketType, isBonus),
      scratched: false,
    });
  }
  
  return grid;
};

// Check for winning patterns in all directions from each cell
const checkWinningPatterns = (grid: ScratchCell[]): {
  wins: { symbolType: SymbolType, count: number, multiplier: number, cellValues?: number[] }[];
  winningCells: number[];
} => {
  const wins: { symbolType: SymbolType, count: number, multiplier: number, cellValues?: number[] }[] = [];
  const winningCells: Set<number> = new Set(); // Use a Set to avoid duplicates
  const GRID_SIZE = 5;
  
  // Convert linear grid to 2D representation for easier directional traversal
  const grid2D: ScratchCell[][] = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    grid2D[r] = [];
    for (let c = 0; c < GRID_SIZE; c++) {
      grid2D[r][c] = grid[r * GRID_SIZE + c];
    }
  }
  
  // Direction vectors: right, down-right, down, down-left
  // (We don't need to check all 8 directions, just these 4 are enough,
  // since the others would be checking the same lines in reverse)
  const directions = [
    [0, 1],  // right
    [1, 1],  // down-right
    [1, 0],  // down
    [1, -1]  // down-left
  ];
  
  // Check if a position is valid on the grid
  const isValid = (row: number, col: number): boolean => {
    return row >= 0 && row < GRID_SIZE && col >= 0 && col < GRID_SIZE;
  };
  
  // Find all winning combinations starting from each cell
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      const cellIndex = row * GRID_SIZE + col;
      const cell = grid2D[row][col];
      
      // Skip unscratched or empty cells as starting points
      if (!cell.scratched || cell.symbol.type === 'empty') {
        continue;
      }
      
      // Skip multiplier cells as starting points
      if (cell.symbol.type === 'multiplier2x' || cell.symbol.type === 'multiplier10x') {
        continue;
      }
      
      // Check each direction
      for (const [dr, dc] of directions) {
        let count = 1;  // Start with 1 for the current cell
        let multiplier = 1;
        let symbolIndices: number[] = [cellIndex];
        let multiplierIndices: number[] = [];
        let cellValues: number[] = [cell.symbol.value]; // Store the value of each matching cell
        
        // Check consecutive cells in this direction
        for (let step = 1; step < GRID_SIZE; step++) {
          const newRow = row + dr * step;
          const newCol = col + dc * step;
          
          if (!isValid(newRow, newCol)) {
            break;
          }
          
          const nextCell = grid2D[newRow][newCol];
          const nextCellIndex = newRow * GRID_SIZE + newCol;
          
          // Skip unscratched cells
          if (!nextCell.scratched) {
            break;
          }
          
          // Handle multipliers
          if (nextCell.symbol.type === 'multiplier2x' || nextCell.symbol.type === 'multiplier10x') {
            if (nextCell.symbol.type === 'multiplier2x') {
              multiplier *= 2;
            } else {
              multiplier *= 10;
            }
            multiplierIndices.push(nextCellIndex);
            continue; // Multipliers don't count toward symbol count
          }
          
          // Skip empty cells
          if (nextCell.symbol.type === 'empty') {
            break;
          }
          
          // If the symbol matches the starting cell, increment count
          if (nextCell.symbol.type === cell.symbol.type) {
            count++;
            symbolIndices.push(nextCellIndex);
            cellValues.push(nextCell.symbol.value); // Store the value
          } else {
            break; // Different symbol breaks the sequence
          }
        }
        
        // If we found 3 or more in a row, register a win
        if (count >= 3) {
          // Add the winning combination
          const symbolType = cell.symbol.type;
          
          // Only include cellValues for token and cash symbols (they have different values)
          const includesCellValues = symbolType.startsWith('token_') || symbolType.startsWith('cash_');
          
          wins.push({
            symbolType: symbolType,
            count: count,
            multiplier: multiplier,
            cellValues: includesCellValues ? cellValues : undefined
          });
          
          // Add all involved cells to the winning cells set
          symbolIndices.forEach(idx => winningCells.add(idx));
          multiplierIndices.forEach(idx => winningCells.add(idx));
        }
      }
    }
  }
  
  return {
    wins,
    winningCells: Array.from(winningCells)
  };
};

// Create a separate component that uses useSearchParams
const ScratchOffPlayContent = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const ticketId = searchParams.get("ticketId");
  const { toast } = useToast();
  const { data: session } = authClient.useSession();
  
  const [ticket, setTicket] = useState<UserScratchTicket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 5x5 grid of scratch cells
  const [grid, setGrid] = useState<ScratchCell[]>([]);
  const [winningCells, setWinningCells] = useState<number[]>([]);
  const [wins, setWins] = useState<{ symbolType: SymbolType, count: number, multiplier: number, cellValues?: number[] }[]>([]);
  const [isRevealed, setIsRevealed] = useState(false);
  const [prize, setPrize] = useState<{
    tokens: number;
    cash: number;
    stocks: number;
    stockShares: Record<string, { shares: number, value: number }>;
  } | null>(null);
  
  // Canvas ref for the overall scratching effect
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scratchPercentage, setScratchPercentage] = useState(0);
  const [isScratching, setIsScratching] = useState(false);
  
  // Function to trigger confetti animation when winning
  const triggerWinAnimation = () => {
    if (typeof window !== 'undefined') {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  };
  
  // Fetch ticket data
  useEffect(() => {
    if (!ticketId) {
      console.log('No ticketId found, redirecting to scratch-offs page');
      router.push("/games/scratch-offs");
      return;
    }

    const fetchTicket = async () => {
      try {
        // Check if we have saved results for this ticket
        if (typeof window !== 'undefined') {
          const savedResults = localStorage.getItem(`ticket-result-${ticketId}`);
          
          if (savedResults) {
            try {
              const results = JSON.parse(savedResults);
              
              // Ticket has been revealed before, load the previous results
              console.log('Loading saved ticket results. Fetching from API:', ticketId);
              const response = await fetch(`/api/users/scratch-tickets/${ticketId}`);
              
              if (!response.ok) {
                console.error('API error status:', response.status, 'for ticketId:', ticketId);
                // If not found, check local storage for ticket details first before informing user
                const userTicketsStr = localStorage.getItem('userScratchTickets');
                const localTicket = userTicketsStr ? 
                  JSON.parse(userTicketsStr).find((t: any) => t.id === ticketId) : null;
                
                if (localTicket) {
                  // Use the local ticket data instead
                  console.log('Using local ticket data for:', ticketId);
                  setTicket(localTicket);
                  
                  // Set the saved state
                  setGrid(results.grid);
                  setWins(results.wins);
                  setWinningCells(results.winningCells);
                  setPrize(results.prize);
                  setIsRevealed(true);
                  
                  setLoading(false);
                  
                  // Production fix: Try to sync this ticket to the database
                  if (session?.user?.id) {
                    fetch('/api/users/scratch-tickets/sync', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json'
                      },
                      body: JSON.stringify({
                        tickets: [localTicket]
                      })
                    }).catch(syncError => console.error('Error syncing local ticket to database:', syncError));
                  }
                  
                  return;
                }
                
                // If nothing found locally either, inform the user
                if (response.status === 404) {
                  toast({
                    title: "Ticket Not Found",
                    description: "This ticket couldn't be found in the database. Redirecting back to the shop.",
                    variant: "destructive"
                  });
                  
                  // Clean up localStorage for this invalid ticket
                  if (ticketId) {
                    removeTicketFromLocalStorage(ticketId);
                  }
                  
                  setTimeout(() => router.push('/games/scratch-offs'), 2000);
                }
                throw new Error(`Error: ${response.status} ${response.statusText}`);
              }
              
              const data = await response.json();
              console.log('API data received:', data);
              setTicket(data);
              
              // Set the saved state
              setGrid(results.grid);
              setWins(results.wins);
              setWinningCells(results.winningCells);
              setPrize(results.prize);
              setIsRevealed(true);
              
              // Store the ticket in localStorage for future reference
              if (typeof window !== 'undefined') {
                try {
                  // Get existing tickets from localStorage or initialize empty array
                  const storedTicketsStr = localStorage.getItem('userScratchTickets');
                  const storedTickets = storedTicketsStr ? JSON.parse(storedTicketsStr) : [];
                  
                  // Check if this ticket already exists in localStorage
                  const existingIndex = storedTickets.findIndex((t: any) => t.id === data.id);
                  
                  if (existingIndex >= 0) {
                    // Update the existing ticket
                    storedTickets[existingIndex] = data;
                  } else {
                    // Add the new ticket
                    storedTickets.push(data);
                  }
                  
                  // Save back to localStorage
                  localStorage.setItem('userScratchTickets', JSON.stringify(storedTickets));
                  console.log('Saved ticket to localStorage:', data.id);
                } catch (storageError) {
                  console.error('Error saving ticket to localStorage:', storageError);
                  // Continue with the game even if storage fails
                }
              }
              
              // Generate grid based on ticket type
              setGrid(generateGrid(data.ticket.type, data.isBonus));
              
              setLoading(false);
              return;
            } catch (error) {
              console.error('Error loading saved results:', error);
              // Continue to normal fetch if there's an error
            }
          }
        }
        
        // Normal fetch if no saved results
        console.log('First time playing ticket. Fetching from API:', ticketId);
        const response = await fetch(`/api/users/scratch-tickets/${ticketId}`);
        
        if (!response.ok) {
          console.error('API error status:', response.status, 'for ticketId:', ticketId);
          
          // Try to find the ticket in local storage
          if (typeof window !== 'undefined') {
            const userTicketsStr = localStorage.getItem('userScratchTickets');
            const localTicket = userTicketsStr ? 
              JSON.parse(userTicketsStr).find((t: any) => t.id === ticketId) : null;
            
            if (localTicket) {
              // Use the local ticket data instead
              console.log('API ticket not found, using local ticket data for:', ticketId);
              setTicket(localTicket);
              
              // Generate grid based on ticket type
              setGrid(generateGrid(localTicket.ticket.type, localTicket.isBonus));
              
              setLoading(false);
              
              // Production fix: Try to sync this ticket to the database
              if (session?.user?.id) {
                fetch('/api/users/scratch-tickets/sync', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    tickets: [localTicket]
                  })
                }).catch(syncError => console.error('Error syncing local ticket to database:', syncError));
              }
              
              return;
            }
          }
          
          // If not found, inform the user and redirect
          if (response.status === 404) {
            toast({
              title: "Ticket Not Found",
              description: "This ticket doesn't exist in the database. It may have been already played or removed. Redirecting back to the shop.",
              variant: "destructive"
            });
            
            // Clean up localStorage for this invalid ticket
            if (ticketId) {
              removeTicketFromLocalStorage(ticketId);
            }
            
            setTimeout(() => router.push('/games/scratch-offs'), 2000);
          }
          throw new Error(`Error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('API data received:', data);
        
        // Validate the ticket data before using it
        if (!data || !data.ticket || !data.ticket.type) {
          setError("Invalid ticket data received from server");
          setLoading(false);
          return;
        }
        
        setTicket(data);
        
        // Store the ticket in localStorage for future reference
        if (typeof window !== 'undefined') {
          try {
            // Get existing tickets from localStorage or initialize empty array
            const storedTicketsStr = localStorage.getItem('userScratchTickets');
            const storedTickets = storedTicketsStr ? JSON.parse(storedTicketsStr) : [];
            
            // Check if this ticket already exists in localStorage
            const existingIndex = storedTickets.findIndex((t: any) => t.id === data.id);
            
            if (existingIndex >= 0) {
              // Update the existing ticket
              storedTickets[existingIndex] = data;
            } else {
              // Add the new ticket
              storedTickets.push(data);
            }
            
            // Save back to localStorage
            localStorage.setItem('userScratchTickets', JSON.stringify(storedTickets));
            console.log('Saved ticket to localStorage:', data.id);
          } catch (storageError) {
            console.error('Error saving ticket to localStorage:', storageError);
            // Continue with the game even if storage fails
          }
        }
        
        // Generate grid based on ticket type
        setGrid(generateGrid(data.ticket.type, data.isBonus));
        
        setLoading(false);
      } catch (error) {
        console.error("Error fetching scratch ticket:", error);
        setError("Failed to load your scratch ticket. Please try again later.");
        setLoading(false);
      }
    };
    
    fetchTicket();
  }, [ticketId, router, toast]);

  // Setup canvas for scratch-off effect
  useEffect(() => {
    if (!canvasRef.current || !ticket || isRevealed) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    console.log('Setting up canvas for scratching');
    
    // Define all the functions inside the useEffect to avoid stale closures
    
    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;
    let scratchedPixels = 0;
    let totalPixels = 0;
    
    // Set canvas dimensions
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      totalPixels = canvas.width * canvas.height;
      
      // Redraw the scratch-off layer
      drawScratchLayer();
      console.log('Canvas resized to', canvas.width, 'x', canvas.height);
    };

    // Draw the scratch-off layer
    const drawScratchLayer = () => {
      // Fill with gray scratch-off layer
      ctx.fillStyle = '#7c7c7c';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    
      // Add some texture/pattern to make it look like a scratch-off
      for (let i = 0; i < 5000; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        ctx.fillStyle = `rgba(120, 120, 120, ${Math.random() * 0.2})`;
        ctx.beginPath();
        ctx.arc(x, y, Math.random() * 2, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    // Simple function to get coordinates from both mouse and touch events
    const getCoordinates = (e: MouseEvent | TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      let clientX, clientY;
      
      if ('touches' in e) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = (e as MouseEvent).clientX;
        clientY = (e as MouseEvent).clientY;
      }
      
      return {
        x: clientX - rect.left,
        y: clientY - rect.top
      };
    };

    // Start scratching
    const startScratch = (e: MouseEvent | TouchEvent) => {
      console.log('Start scratching');
      isDrawing = true;
      setIsScratching(true);
      const coords = getCoordinates(e);
      lastX = coords.x;
      lastY = coords.y;
      e.preventDefault(); // Prevent default behavior
      scratch(e); // Immediately start scratching
    };

    // Scratch function
    const scratch = (e: MouseEvent | TouchEvent) => {
      if (!isDrawing) return;
      e.preventDefault();

      const coords = getCoordinates(e);
      
      // Set up the scratching effect
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      
      // Draw a circle at the current position
      ctx.arc(coords.x, coords.y, 20, 0, Math.PI * 2, false);
      ctx.fill();
      
      // Also draw a line from last position to current position
      ctx.lineWidth = 40;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(lastX, lastY);
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
      
      lastX = coords.x;
      lastY = coords.y;

      // Calculate scratch percentage
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      scratchedPixels = 0;
      
      for (let i = 3; i < imageData.data.length; i += 4) {
        if (imageData.data[i] < 128) {
          scratchedPixels++;
        }
      }

      const percentage = Math.round((scratchedPixels / totalPixels) * 100);
      setScratchPercentage(percentage);
      console.log('Scratch percentage:', percentage);

      // Calculate grid cell for scratched position
      const cellWidth = canvas.width / 5;
      const cellHeight = canvas.height / 5;
      const col = Math.floor(coords.x / cellWidth);
      const row = Math.floor(coords.y / cellHeight);
      
      if (col >= 0 && col < 5 && row >= 0 && row < 5) {
        // Reveal the cell at the scratch position
        const cellIndex = row * 5 + col;
        
        // Copy the scratchCell function logic here to avoid dependency issues
        if (isRevealed) return;
        
        setGrid(prev => {
          const newGrid = [...prev];
          if (!newGrid[cellIndex].scratched) {
            newGrid[cellIndex] = {
              ...newGrid[cellIndex],
              scratched: true
            };
            
            // Check for winning combinations
            const { wins: newWins, winningCells: newWinningCells } = checkWinningPatterns(newGrid);
            setWins(newWins);
            setWinningCells(newWinningCells);
          }
          
          return newGrid;
        });
        
        // Also reveal adjacent cells for smoother experience
        for (let i = -1; i <= 1; i++) {
          for (let j = -1; j <= 1; j++) {
            const newCol = col + i;
            const newRow = row + j;
            if (newCol >= 0 && newCol < 5 && newRow >= 0 && newRow < 5) {
              const adjacentCellIndex = newRow * 5 + newCol;
              
              // Similar logic for adjacent cells
              setGrid(prev => {
                const newGrid = [...prev];
                if (!newGrid[adjacentCellIndex].scratched) {
                  newGrid[adjacentCellIndex] = {
                    ...newGrid[adjacentCellIndex],
                    scratched: true
                  };
                }
                return newGrid;
              });
            }
          }
        }
      }

      // Auto-reveal when enough is scratched
      if (percentage > 45 && !isRevealed) {
        setIsRevealed(true);
        
        // Scratch all cells
        setGrid(prev => 
          prev.map(cell => ({
            ...cell,
            scratched: true
          }))
        );
        
        // Check for winning combinations
        const fullScratchedGrid = grid.map(cell => ({
          ...cell,
          scratched: true
        }));
        
        const { wins: finalWins, winningCells: finalWinningCells } = checkWinningPatterns(fullScratchedGrid);
        setWins(finalWins);
        setWinningCells(finalWinningCells);
        
        // Calculate prize outside this function to avoid dependency issues
        calculatePrize(finalWins).then(prizeData => {
          setPrize(prizeData);
          
          // If there's a winning prize, trigger the confetti animation
          if (prizeData.tokens > 0 || prizeData.cash > 0 || prizeData.stocks > 0) {
            triggerWinAnimation();
          }
        }).catch(error => {
          console.error('Error calculating prize:', error);
        });

        // Mark as played for API update
        fetch(`/api/users/scratch-tickets/${ticketId}/scratch`, {
          method: 'POST',
        }).catch(error => {
          console.error('Error marking ticket as scratched:', error);
          // Fallback to localStorage if API fails
          markTicketAsPlayedInLocalStorage();
        });

        // Save results to localStorage for future reference
        saveTicketResultsToLocalStorage(finalWins, finalWinningCells);
      }
    };

    // Stop scratching
    const stopScratch = () => {
      isDrawing = false;
      setIsScratching(false);
    };

    // Initialize canvas
    resizeCanvas();
    
    // Add event listeners
    canvas.addEventListener('mousedown', startScratch);
    canvas.addEventListener('mousemove', scratch);
    window.addEventListener('mouseup', stopScratch);
    window.addEventListener('resize', resizeCanvas);
    
    // Touch events - important for mobile
    canvas.addEventListener('touchstart', startScratch, { passive: false });
    canvas.addEventListener('touchmove', scratch, { passive: false });
    window.addEventListener('touchend', stopScratch);
    
    // Cleanup event listeners when component unmounts or ticket changes
    return () => {
      console.log('Cleaning up canvas event listeners');
      canvas.removeEventListener('mousedown', startScratch);
      canvas.removeEventListener('mousemove', scratch);
      window.removeEventListener('mouseup', stopScratch);
      window.removeEventListener('resize', resizeCanvas);
      
      canvas.removeEventListener('touchstart', startScratch);
      canvas.removeEventListener('touchmove', scratch);
      window.removeEventListener('touchend', stopScratch);
    };
  }, [ticketId, ticket, isRevealed]);

  // Scratch a single cell
  const scratchCell = (cellIndex: number) => {
    if (isRevealed) return;
    
    setGrid(prev => {
      const newGrid = [...prev];
      if (!newGrid[cellIndex].scratched) {
        newGrid[cellIndex] = {
          ...newGrid[cellIndex],
          scratched: true
        };
        
        // Check for winning combinations
        const { wins: newWins, winningCells: newWinningCells } = checkWinningPatterns(newGrid);
        setWins(newWins);
        setWinningCells(newWinningCells);
      }
      
      return newGrid;
    });
  };

  // Function to completely remove a ticket from localStorage
  const removeTicketFromLocalStorage = (ticketId: string) => {
    if (typeof window === 'undefined') return;
    
    try {
      console.log(`Attempting to remove ticket ${ticketId} from localStorage`);
      
      // Get current tickets
      const storedTicketsStr = localStorage.getItem('userScratchTickets');
      if (!storedTicketsStr) return;
      
      // Parse and filter
      const storedTickets = JSON.parse(storedTicketsStr);
      const updatedTickets = storedTickets.filter((t: any) => t.id !== ticketId);
      
      // Save back
      localStorage.setItem('userScratchTickets', JSON.stringify(updatedTickets));
      console.log(`Removed ticket ${ticketId} from localStorage, remaining: ${updatedTickets.length}`);
      
      // Trigger update events
      const timestamp = Date.now().toString();
      localStorage.setItem('tickets-updated', timestamp);
      
      // Fire multiple events to ensure all components update
      try {
        window.dispatchEvent(new CustomEvent('tickets-updated'));
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'tickets-updated',
          newValue: timestamp
        }));
      } catch (eventError) {
        console.error('Error dispatching events:', eventError);
      }
    } catch (error) {
      console.error('Error removing ticket from localStorage:', error);
    }
  };

  // Reveal the entire grid
  const revealAll = async () => {
    if (isRevealed) return;
    
    // Show a neat reveal animation
    grid.forEach((cell, index) => {
      setTimeout(() => {
        scratchCell(index);
      }, index * 60); // staggered reveal
    });
    
    // Calculate any wins
    const { wins: finalWins, winningCells: finalWinningCells } = checkWinningPatterns(grid);
    setWins(finalWins);
    setWinningCells(finalWinningCells);
    
    // Update local state 
    setIsRevealed(true);
    
    if (ticket && 'id' in ticket) {
      try {
        // Mark the ticket as scratched in the database - even if there are no wins
        const response = await fetch(`/api/users/scratch-tickets/${ticket.id}/scratch`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            wins: finalWins,
            revealedAt: new Date().toISOString()
          }),
        });
        
        if (response.ok) {
          console.log('Ticket marked as scratched in database');
          
          // Always remove from localStorage
          removeTicketFromLocalStorage(ticket.id);
          
          // Calculate prize amounts - only if there are wins
          if (finalWins.length > 0) {
            calculatePrize(finalWins).then(prizeData => {
              setPrize(prizeData);
              
              // If there's a prize, trigger confetti
              triggerWinAnimation();
            }).catch(error => {
              console.error('Error calculating prize:', error);
            });
          }
        } else {
          console.error('Failed to mark ticket as scratched', await response.text());
          
          // Even if server update fails, save results locally
          saveTicketResultsToLocalStorage(finalWins, finalWinningCells);
          markTicketAsPlayedInLocalStorage();
          
          // Also remove from My Tickets list
          removeTicketFromLocalStorage(ticket.id);
        }
      } catch (error) {
        console.error('Error updating scratch status:', error);
        
        // Save results locally if there's an error
        saveTicketResultsToLocalStorage(finalWins, finalWinningCells);
        markTicketAsPlayedInLocalStorage();
        
        // Also remove from My Tickets list
        if (ticket.id) {
          removeTicketFromLocalStorage(ticket.id);
        }
      }
    } else {
      // Local ticket flow
      saveTicketResultsToLocalStorage(finalWins, finalWinningCells);
      markTicketAsPlayedInLocalStorage();
      
      // Also remove from My Tickets list if we have a ticketId
      if (ticketId) {
        removeTicketFromLocalStorage(ticketId);
      }
    }
  };
  
  // Save revealed ticket results to localStorage for persistence
  const saveTicketResultsToLocalStorage = (finalWins: any, finalWinningCells: number[]) => {
    if (!ticketId) return;
    
    try {
      const ticketResults = {
        ticketId,
        grid: grid.map(cell => ({ ...cell, scratched: true })),
        wins: finalWins,
        winningCells: finalWinningCells,
        prize: prize
      };
      
      localStorage.setItem(`ticket-result-${ticketId}`, JSON.stringify(ticketResults));
    } catch (error) {
      console.error('Error saving ticket results:', error);
    }
  };
  
  // Function to handle back button - should still redirect but not restore the ticket
  const handleBackClick = () => {
    // Don't allow going back without revealing if the results are already shown
    if (isRevealed) {
      router.push("/games/scratch-offs");
    } else {
      // If not revealed, confirm with the user
      if (confirm("Are you sure you want to go back? Your progress will be lost.")) {
        router.push("/games/scratch-offs");
      }
    }
  };
  
  // Calculate the final prize
  const calculatePrize = async (finalWins: { symbolType: SymbolType, count: number, multiplier: number, cellValues?: number[] }[]): Promise<{
    tokens: number;
    cash: number;
    stocks: number;
    stockShares: Record<string, { shares: number, value: number }>;
  }> => {
    try {
      let tokenPrize = 0;
      let cashPrize = 0;
      let stockPrize = 0;
      let stockShares: Record<string, { shares: number, value: number }> = {};
      
      finalWins.forEach(win => {
        const symbolType = win.symbolType;
        const multiplier = win.multiplier;
        
        // Handle token amount symbols - sum values first, then multiply
        if (symbolType.startsWith('token_')) {
          if (win.cellValues) {
            // Sum all token values, then apply multiplier
            const totalValue = win.cellValues.reduce((sum, val) => sum + val, 0);
            tokenPrize += totalValue * multiplier;
          } else {
            // Fallback to old calculation if cellValues is not available
            const amount = parseInt(symbolType.replace('token_', ''));
            const baseValue = win.count * amount;
            tokenPrize += baseValue * multiplier;
          }
        }
        // Handle stock symbols
        else if (symbolType.startsWith('stock_')) {
          const stockSymbol = symbolType.replace('stock_', '');
          // Increased to 0.2 shares per match
          const baseValue = win.count * 0.2; 
          
          // Apply special multipliers for Mystic Chance (100x) and Diamond Scratch (300x)
          let ticketTypeMultiplier = 1;
          if (ticket && ticket.ticket) {
            if (ticket.ticket.type === 'random') {
              ticketTypeMultiplier = 100; // Mystic Chance: 100x multiplier
            } else if (ticket.ticket.type === 'diamond') {
              ticketTypeMultiplier = 300; // Diamond Scratch: 300x multiplier
            }
          }
          
          const shares = baseValue * multiplier * ticketTypeMultiplier;
          
          // Find the stock value from STOCK_SYMBOLS
          const stockInfo = STOCK_SYMBOLS.find(s => s.symbol === stockSymbol);
          if (stockInfo) {
            // Add to stock prize and track shares
            const value = shares * stockInfo.value;
            stockPrize += value;
            
            // Track shares by stock symbol
            if (!stockShares[stockSymbol]) {
              stockShares[stockSymbol] = { shares: 0, value: stockInfo.value };
            }
            stockShares[stockSymbol].shares += shares;
          }
        }
        // Handle cash amount symbols
        else if (symbolType.startsWith('cash_')) {
          if (win.cellValues) {
            // Sum all cash values, then apply multiplier (similar to tokens)
            const totalValue = win.cellValues.reduce((sum, val) => sum + val, 0);
            // No longer apply divisor - use full cash values
            cashPrize += totalValue * multiplier;
          } else {
            // Fallback to old calculation if cellValues is not available
            const amount = parseInt(symbolType.replace('cash_', ''));
            // Use full amount without divisor
            const baseValue = win.count * amount;
            cashPrize += baseValue * multiplier;
          }
        }
        // Handle regular symbols (legacy support)
        else {
          // Apply special multipliers for Mystic Chance (100x) and Diamond Scratch (300x)
          let ticketTypeMultiplier = 1;
          if (ticket && ticket.ticket) {
            if (ticket.ticket.type === 'random') {
              ticketTypeMultiplier = 100; // Mystic Chance: 100x multiplier
            } else if (ticket.ticket.type === 'diamond') {
              ticketTypeMultiplier = 300; // Diamond Scratch: 300x multiplier
            }
          }
          
          const baseValue = win.count * 15 * ticketTypeMultiplier;
          
          if (symbolType === 'token') {
            tokenPrize += baseValue * multiplier;
          } else if (symbolType === 'cash') {
            cashPrize += baseValue * multiplier;
          } else if (symbolType === 'stock') {
            stockPrize += baseValue * multiplier;
          }
        }
        
        // Special handling for token amounts in Mystic Chance and Diamond Scratch
        if (symbolType.startsWith('token_')) {
          // Apply special multipliers for these ticket types
          if (ticket && ticket.ticket) {
            if (ticket.ticket.type === 'random' || ticket.ticket.type === 'diamond') {
              const specialMultiplier = ticket.ticket.type === 'random' ? 100 : 300;
              
              // If we already calculated the value, multiply it by the special multiplier
              tokenPrize *= specialMultiplier;
            }
          }
        }
        
        // Special handling for cash amounts in Mystic Chance and Diamond Scratch
        if (symbolType.startsWith('cash_')) {
          // Apply special multipliers for these ticket types
          if (ticket && ticket.ticket) {
            if (ticket.ticket.type === 'random' || ticket.ticket.type === 'diamond') {
              const specialMultiplier = ticket.ticket.type === 'random' ? 100 : 300;
              
              // If we already calculated the value, multiply it by the special multiplier
              cashPrize *= specialMultiplier;
            }
          }
        }
      });
      
      // Apply 25% bonus for bonus tickets
      if (ticket?.isBonus) {
        tokenPrize = Math.floor(tokenPrize * 1.25);
        cashPrize = cashPrize * 1.25;
        stockPrize = stockPrize * 1.25;
        
        // Apply 25% bonus to individual stock shares
        Object.keys(stockShares).forEach(symbol => {
          stockShares[symbol].shares *= 1.25;
        });
      }
      
      // Set the final prize
      const finalPrize = {
        tokens: Math.round(tokenPrize), // Round to whole numbers
        cash: Math.round(cashPrize * 100) / 100, // Round to 2 decimals
        stocks: Math.round(stockPrize * 100) / 100,
        stockShares
      };
      
      setPrize(finalPrize);
      
      // Show toast with prize details - SINGLE TOAST ONLY
      if (tokenPrize > 0 || cashPrize > 0 || stockPrize > 0) {
        let prizeText = "";
        if (tokenPrize > 0) prizeText += `${tokenPrize} tokens `;
        if (cashPrize > 0) prizeText += `$${cashPrize} `;
        
        // For stock shares, list them individually
        if (Object.keys(stockShares).length > 0) {
          const stockText = Object.entries(stockShares)
            .map(([symbol, info]) => `${info.shares.toFixed(2)} ${symbol}`)
            .join(', ');
          prizeText += `${stockText} `;
        } else if (stockPrize > 0) {
          prizeText += `${stockPrize} stock points `;
        }
        
        // Just one toast message
        toast({
          title: "You Won!",
          description: `Congratulations! You've won ${prizeText.trim()}`,
          duration: 5000, // Longer duration for win messages
        });
        
        // Trigger confetti animation for winners
        triggerWinAnimation();
        
        // Send API request to update the user's tokens/assets
        try {
          // Create the request data
          const requestData = {
            ticketId: ticketId,
            prize: finalPrize
          };
          
          const response = await fetch('/api/users/scratch-tickets/claim-prize', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData),
          });
          
          if (!response.ok) {
            console.error('Error claiming prize:', await response.text());
            throw new Error('Failed to update tokens');
          }
          
          // Success! Token balance has been updated on the server
          // Trigger token refresh in all components by updating localStorage
          if (typeof window !== 'undefined') {
            localStorage.setItem('token-refresh', Date.now().toString());
            // Fire a storage event to update other tabs
            window.dispatchEvent(new StorageEvent('storage', {
              key: 'token-refresh',
              newValue: Date.now().toString()
            }));
          }
        } catch (error) {
          console.error('Error updating tokens:', error);
          toast({
            title: "Error",
            description: "Your prize has been calculated but there was an error updating your balance. Please contact support.",
          });
        }
      } else {
        // Only show the "Better luck next time!" toast once
        // Use localStorage to track if we've already shown this toast for this ticket
        const toastShownKey = `no-win-toast-${ticketId}`;
        const toastAlreadyShown = localStorage.getItem(toastShownKey);
        
        if (!toastAlreadyShown) {
          toast({
            title: "Better luck next time!",
            description: "No winning combinations found. Try again with another ticket!",
            duration: 3000,
          });
          
          // Mark that we've shown this toast
          localStorage.setItem(toastShownKey, "true");
        }
      }

      return finalPrize;
    } catch (error) {
      console.error('Error calculating prize:', error);
      toast({
        title: "Error",
        description: "There was an error calculating your prize. Please try again or contact support.",
      });
      
      // Return an empty prize object in case of error
      return {
        tokens: 0,
        cash: 0,
        stocks: 0,
        stockShares: {}
      };
    }
  };

  // Helper to mark ticket as played in localStorage (fallback only)
  const markTicketAsPlayedInLocalStorage = () => {
    if (!session?.user?.id) return;
    
    const userId = session.user.id;
    const savedTicketsStr = localStorage.getItem(`user-${userId}-tickets`);
    
    if (savedTicketsStr) {
      try {
        const savedTickets = JSON.parse(savedTicketsStr);
        // Update the played ticket
        const updatedTickets = savedTickets.map((t: any) => {
          if (t.id === ticketId) {
            return { ...t, scratched: true };
          }
          return t;
        });
        
        // Save back to localStorage
        localStorage.setItem(`user-${userId}-tickets`, JSON.stringify(updatedTickets));
      } catch (error) {
        console.error('Error updating ticket in localStorage:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="w-full h-screen flex justify-center items-center">
        <LoadingStateAnimation />
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="w-full h-screen flex flex-col justify-center items-center">
        <h2 className="text-2xl font-bold text-white mb-4">Oops!</h2>
        <p className="text-gray-400 mb-6">{error || "Ticket not found"}</p>
        <button 
          onClick={() => router.push("/games/scratch-offs")}
          className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded font-medium"
        >
          Back to Scratch Offs
        </button>
      </div>
    );
  }

  const styles = getTicketTypeStyles(ticket.ticket.type);

  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 max-w-lg w-full shadow-xl">
        <h1 className="text-2xl font-bold text-white mb-6 text-center">
          {ticket.ticket.name}
          {ticket.isBonus && <span className="ml-2 text-yellow-400">(Bonus!)</span>}
        </h1>
        
        <div className="relative mb-6">
          {/* Background gradient */}
          <div className={`relative bg-gradient-to-br ${styles.gradientFrom} ${styles.gradientTo} rounded-lg overflow-hidden`}>
            {/* Grid container */}
            <div className="grid grid-cols-5 gap-1 p-3 relative z-10">
              {grid.map((cell, index) => (
                <div 
                  key={cell.id}
                  className={`
                    w-full aspect-square rounded flex items-center justify-center
                    ${cell.scratched ? 'bg-gray-800/80' : 'opacity-0'} 
                    ${winningCells.includes(index) ? 
                      'bg-gray-800/90 shadow-lg relative' : 
                      'bg-gray-800/60'
                    }
                    transition-opacity duration-300
                  `}
                >
                  {cell.scratched && cell.symbol.type !== 'empty' && (
                    <>
                      {/* Add winning highlight glow that matches symbol color */}
                      {winningCells.includes(index) && (
                        <div className={`
                          absolute inset-0 rounded-full m-1.5 animate-pulse
                          ${cell.symbol.type === 'token' || cell.symbol.type.startsWith('token_') ? 'bg-yellow-500/20' : ''}
                          ${cell.symbol.type === 'stock' || cell.symbol.type.startsWith('stock_') ? 'bg-blue-500/20' : ''}
                          ${cell.symbol.type === 'cash' || cell.symbol.type.startsWith('cash_') ? 'bg-green-500/20' : ''}
                          ${cell.symbol.type === 'multiplier2x' ? 'bg-orange-400/20' : ''}
                          ${cell.symbol.type === 'multiplier10x' ? 'bg-red-500/20' : ''}
                        `}></div>
                      )}
                      
                      {/* Icon without background for clean look */}
                      <span className={`${cell.symbol.color}`}>
                        {cell.symbol.icon && (
                          typeof cell.symbol.icon === 'object' ? 
                            cell.symbol.icon : 
                            String(cell.symbol.icon)
                        )}
                      </span>
                    </>
                  )}
                </div>
              ))}
            </div>
            
            {/* Pattern overlay */}
            <div className="absolute inset-0 opacity-25 bg-pattern-dots pointer-events-none"></div>
            
            {/* Scratch-off layer - ensure it has higher z-index */}
            <canvas 
              ref={canvasRef} 
              className={`absolute inset-0 w-full h-full rounded-lg transition-opacity duration-300 z-30 
                ${isRevealed ? 'opacity-0 pointer-events-none' : 'cursor-pointer'}`}
              style={{ touchAction: 'none' }}
            />
            
            {/* Helper text - only shown when not yet revealed and not actively scratching */}
            {!isRevealed && !isScratching && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                <p className="text-white text-lg font-semibold bg-black bg-opacity-60 px-4 py-2 rounded">
                  Scratch to reveal!
                </p>
              </div>
            )}
            
            {/* Progress indicator removed */}
          </div>
        </div>
        
        {/* Results panel - show after revealing */}
        {isRevealed && (
          <div className="bg-gray-700/50 rounded-lg p-4 mb-4">
            <h3 className="text-lg font-bold text-white mb-2">Results</h3>
            
            {wins.length > 0 ? (
              <div className="space-y-2">
                <p className="text-green-400 font-medium">You have winning combinations!</p>
                <ul className="space-y-1">
                  {wins.map((win, idx) => {
                    // Different display for different win types
                    let displayValue = "";
                    const symbolType = win.symbolType;
                    
                    if (symbolType.startsWith('token_')) {
                      if (win.cellValues) {
                        // Show the sum of all token values, then multiplier
                        const totalValue = win.cellValues.reduce((sum, val) => sum + val, 0);
                        const individualValues = win.cellValues.join(' + ');
                        const multipliedValue = totalValue * win.multiplier;
                        displayValue = `${win.count} in a row (${individualValues}) = ${totalValue}${win.multiplier > 1 ? ` × ${win.multiplier}x = ${multipliedValue}` : ''} tokens`;
                      } else {
                        const tokenAmount = parseInt(symbolType.replace('token_', ''));
                        const totalValue = win.count * tokenAmount;
                        const multipliedValue = totalValue * win.multiplier;
                        displayValue = `${win.count} in a row - ${totalValue}${win.multiplier > 1 ? ` × ${win.multiplier}x = ${multipliedValue}` : ''} tokens`;
                      }
                    }
                    else if (symbolType.startsWith('stock_')) {
                      const stockSymbol = symbolType.replace('stock_', '');
                      const shareCount = win.count * 0.2 * win.multiplier;
                      displayValue = `${win.count} in a row - ${shareCount.toFixed(2)} shares of ${stockSymbol}`;
                    }
                    else if (symbolType.startsWith('cash_')) {
                      const cashAmount = parseInt(symbolType.replace('cash_', ''));
                      const baseAmount = win.count * cashAmount;
                      const total = baseAmount * win.multiplier;
                      displayValue = `${win.count} in a row - $${total.toFixed(2)}`;
                    }
                    else {
                      const baseValue = win.count * 15;
                      displayValue = `${win.count} in a row${win.multiplier > 1 ? 
                        ` - ${baseValue} × ${win.multiplier}x = ${baseValue * win.multiplier} ${symbolType}s` : 
                        ` = ${baseValue} ${symbolType}s`}`;
                    }
                    
                    return (
                      <li key={idx} className="flex items-center text-gray-300">
                        <span className={`${SYMBOLS[win.symbolType].color} mr-2`}>
                          {SYMBOLS[win.symbolType].icon && (
                            typeof SYMBOLS[win.symbolType].icon === 'object' ? 
                              SYMBOLS[win.symbolType].icon : 
                              String(SYMBOLS[win.symbolType].icon)
                          )}
                        </span>
                        <span>{displayValue}</span>
                      </li>
                    );
                  })}
                </ul>
                
                {prize && (
                  <div className="mt-4 p-3 bg-gray-800 rounded-lg">
                    <p className="text-white font-bold mb-2">Your Prize:</p>
                    {ticket?.isBonus && (
                      <div className="bg-yellow-900/30 border border-yellow-600/30 rounded-md p-2 mb-3">
                        <p className="text-yellow-400 font-semibold flex items-center">
                          <FaStar className="mr-2 text-yellow-400" /> 25% Bonus Applied to All Winnings!
                        </p>
                      </div>
                    )}
                    <div className="space-y-1">
                      {prize.tokens > 0 && (
                        <p className="text-yellow-400 flex items-center text-lg">
                          <FaCoins className="mr-2" /> {prize.tokens} Tokens
                          {ticket?.isBonus && (
                            <span className="ml-2 text-sm text-yellow-300 bg-yellow-900/30 px-2 py-0.5 rounded">
                              +25% Bonus Applied
                            </span>
                          )}
                        </p>
                      )}
                      {prize.cash > 0 && (
                        <p className="text-green-400 flex items-center text-lg">
                          <FaMoneyBillWave className="mr-2" /> ${prize.cash} Cash
                          {ticket?.isBonus && (
                            <span className="ml-2 text-sm text-green-300 bg-green-900/30 px-2 py-0.5 rounded">
                              +25% Bonus Applied
                            </span>
                          )}
                        </p>
                      )}
                      
                      {/* Display individual stock shares with improved bonus indicators */}
                      {prize.stockShares && Object.entries(prize.stockShares).length > 0 ? (
                        Object.entries(prize.stockShares).map(([symbol, info], idx) => (
                          <p key={idx} className="text-blue-400 flex items-center text-lg">
                            <FaChartLine className="mr-2" /> 
                            {info.shares.toFixed(2)} shares of {symbol} (${(info.shares * info.value).toFixed(2)})
                            {ticket?.isBonus && (
                              <span className="ml-2 text-sm text-blue-300 bg-blue-900/30 px-2 py-0.5 rounded">
                                +25% Bonus Applied
                              </span>
                            )}
                          </p>
                        ))
                      ) : prize.stocks > 0 ? (
                        <p className="text-blue-400 flex items-center text-lg">
                          <FaChartLine className="mr-2" /> {prize.stocks} Stock Points
                          {ticket?.isBonus && (
                            <span className="ml-2 text-sm text-blue-300 bg-blue-900/30 px-2 py-0.5 rounded">
                              +25% Bonus Applied
                            </span>
                          )}
                        </p>
                      ) : null}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-300">No winning combinations. Better luck next time!</p>
            )}
          </div>
        )}

        <div className="flex justify-center">
          <button 
            onClick={handleBackClick}
            className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded font-medium mr-4"
          >
            Back
          </button>
          {!isRevealed ? (
            <button 
              onClick={revealAll}
              className="bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded font-medium"
            >
              Reveal All
            </button>
          ) : (
            <button 
              onClick={() => {
                // Make sure the ticket is marked as scratched in localStorage
                if (typeof window !== 'undefined' && ticketId) {
                  try {
                    // Force API call to mark as scratched first (for reliability)
                    fetch(`/api/users/scratch-tickets/${ticketId}/scratch`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json'
                      },
                      body: JSON.stringify({ 
                        scratched: true,
                        scratchedAt: new Date().toISOString()
                      })
                    }).catch(err => console.error('API scratch marking error:', err));

                    // Remove the ticket completely from localStorage
                    removeTicketFromLocalStorage(ticketId);
                    
                    // Explicitly dispatch a tickets-updated event to ensure UI is refreshed
                    window.dispatchEvent(new CustomEvent('tickets-updated'));
                  } catch (error) {
                    console.error('Error updating localStorage before navigation:', error);
                  }
                }
                
                // Navigate back to scratch-offs page
                router.push("/games/scratch-offs");
              }}
              className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded font-medium"
            >
              Continue
            </button>
          )}
        </div>
        
        {/* Help text */}
        <div className="mt-4 text-xs text-gray-400 text-center">
          <p>Match 3 or more of the same symbol in a row, column, or diagonal to win!</p>
          <p className="mt-1">Multipliers (2x and 10x) increase your winnings when they appear in winning lines.</p>
        </div>
      </div>
    </div>
  );
};

// Main component that renders the content inside a Suspense boundary
const ScratchOffPlay: FunctionComponent = () => {
  return (
    <Suspense fallback={<LoadingStateAnimation />}>
      <ScratchOffPlayContent />
    </Suspense>
  );
};

export default ScratchOffPlay; 