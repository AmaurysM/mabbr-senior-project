"use client";
import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';

interface Cell {
  isBomb: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  adjacentBombs: number;
  isBonus?: boolean; // New property for bonus (orange) tiles
}

type Grid = Cell[][];

const rows = 10;
const cols = 10;
const BOMB_PROBABILITY = 0.15; // 15% chance of a bomb, adjustable between 0 and 1
const GAME_COST = 25; // Cost in tokens to play the game

const CryptoSweeper = () => {
  const [grid, setGrid] = useState<Grid>([]);
  const [gameOver, setGameOver] = useState(false);
  const [win, setWin] = useState(false);
  const [isMobile, setIsMobile] = useState(false); // Tracks device type
  const [isFlagMode, setIsFlagMode] = useState(false); // Tracks Flag Mode for mobile
  const [userTokens, setUserTokens] = useState<number | null>(null); // User's token balance
  const [gameTokens, setGameTokens] = useState(0); // Tokens accumulated in the current game
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [isCashing, setIsCashing] = useState(false); // To prevent multiple cash-out calls
  const hasWonRef = useRef(false); // Tracks if win has been processed
  const isFirstClickRef = useRef(true); // Track if this is the first click of the game

  useEffect(() => {
    // Detect mobile device
    const mobileCheck = /Mobi|Android/i.test(navigator.userAgent);
    setIsMobile(mobileCheck);

    // Fetch user's token balance
    fetchUserTokens();
    
    // Initialize an empty grid (don't start a game yet)
    const emptyGrid: Grid = [];
    for (let i = 0; i < rows; i++) {
      emptyGrid[i] = [];
      for (let j = 0; j < cols; j++) {
        emptyGrid[i][j] = {
          isBomb: false,
          isRevealed: false,
          isFlagged: false,
          adjacentBombs: 0,
        };
      }
    }
    setGrid(emptyGrid);

    // Set up listener for token balance updates from other components
    const handleTokenUpdate = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail && customEvent.detail.newBalance !== undefined) {
        setUserTokens(customEvent.detail.newBalance);
      } else {
        fetchUserTokens();
      }
    };

    window.addEventListener('token-balance-updated', handleTokenUpdate);
    
    return () => {
      window.removeEventListener('token-balance-updated', handleTokenUpdate);
    };
  }, []);

  const fetchUserTokens = async () => {
    try {
      const response = await fetch('/api/user/info', {
        credentials: 'include',
      });
      
      if (response.ok) {
        const userData = await response.json();
        setUserTokens(userData.tokenCount || 0);
      }
    } catch (error) {
      console.error('Failed to fetch user token balance:', error);
    }
  };

  const startNewGame = async () => {
    if (isGameStarted) {
      // If already in a game, this is a cash-out button
      await cashOut();
      return;
    }

    // Check if user has enough tokens
    if (userTokens === null || userTokens < GAME_COST) {
      toast.error(`You need at least ${GAME_COST} tokens to play this game.`);
      return;
    }

    try {
      // Call API to deduct tokens and start a new game
      const response = await fetch('/api/games/crypto-minesweeper', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'start-game'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start game');
      }

      const data = await response.json();
      setUserTokens(data.tokenCount);
      // Broadcast token balance update
      window.dispatchEvent(new CustomEvent('token-balance-updated', { detail: { newBalance: data.tokenCount } }));
      window.localStorage.setItem('token-balance-updated', Date.now().toString());
      window.dispatchEvent(new StorageEvent('storage', { key: 'token-refresh', newValue: Date.now().toString() }));
      setGameTokens(0);
      
      // Initialize game grid without placing bombs yet - bombs will be placed after first click
      initializeEmptyGrid();
      setIsGameStarted(true);
      setGameOver(false);
      setWin(false);
      hasWonRef.current = false;
      isFirstClickRef.current = true; // Reset first click flag
      toast.success(`Game started! ${GAME_COST} tokens deducted. Reveal safe cells to earn tokens!`);
    } catch (error) {
      console.error('Error starting game:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to start game');
    }
  };

  const cashOut = async () => {
    if (isCashing) return;
    
    try {
      setIsCashing(true);
      const response = await fetch('/api/games/crypto-minesweeper', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'cash-out',
          currentTokens: gameTokens
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to cash out');
      }

      const data = await response.json();
      setUserTokens(data.tokenCount);
      // Update UI and dispatch global token update
      window.dispatchEvent(new CustomEvent('token-balance-updated', { detail: { newBalance: data.tokenCount } }));
      window.localStorage.setItem('token-balance-updated', Date.now().toString());
      window.dispatchEvent(new StorageEvent('storage', { key: 'token-refresh', newValue: Date.now().toString() }));
      
      // Reset game state
      setIsGameStarted(false);
      setGameTokens(0);
      
      // Initialize an empty grid
      initializeEmptyGrid();
    } catch (error) {
      console.error('Error cashing out:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to cash out');
    } finally {
      setIsCashing(false);
    }
  };

  // Initialize grid without any bombs - just empty cells
  const initializeEmptyGrid = () => {
    const newGrid: Grid = [];
    for (let i = 0; i < rows; i++) {
      newGrid[i] = [];
      for (let j = 0; j < cols; j++) {
        newGrid[i][j] = {
          isBomb: false,
          isRevealed: false,
          isFlagged: false,
          adjacentBombs: 0,
        };
      }
    }
    setGrid(newGrid);
  };

  // Initialize the grid with bombs, avoiding the first clicked cell
  const initializeGridWithBombs = (firstRow: number, firstCol: number) => {
    const newGrid: Grid = [];
    
    // First create an empty grid
    for (let i = 0; i < rows; i++) {
      newGrid[i] = [];
      for (let j = 0; j < cols; j++) {
        newGrid[i][j] = {
          isBomb: false,
          isRevealed: false,
          isFlagged: false,
          adjacentBombs: 0,
        };
      }
    }
    
    // Now place bombs, avoiding the first clicked cell and its surrounding cells
    let bombsPlaced = 0;
    const totalCells = rows * cols;
    const targetBombs = Math.floor(totalCells * BOMB_PROBABILITY);
    
    while (bombsPlaced < targetBombs) {
      const i = Math.floor(Math.random() * rows);
      const j = Math.floor(Math.random() * cols);
      
      // Skip the first clicked cell and its adjacent cells
      if (Math.abs(i - firstRow) <= 1 && Math.abs(j - firstCol) <= 1) {
        continue;
      }
      
      // If this cell doesn't already have a bomb, place one
      if (!newGrid[i][j].isBomb) {
        newGrid[i][j].isBomb = true;
        bombsPlaced++;
      }
    }
    
    // Add bonus tiles to non-bomb cells
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        if (!newGrid[i][j].isBomb) {
          newGrid[i][j].isBonus = Math.random() < 0.03; // 3% chance for bonus tile
        }
      }
    }
    
    // Calculate adjacent bombs
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        if (!newGrid[i][j].isBomb) {
          newGrid[i][j].adjacentBombs = countAdjacentBombs(newGrid, i, j);
        }
      }
    }
    
    return newGrid;
  };

  const countAdjacentBombs = (grid: Grid, row: number, col: number) => {
    let count = 0;
    for (let di = -1; di <= 1; di++) {
      for (let dj = -1; dj <= 1; dj++) {
        if (di === 0 && dj === 0) continue;
        const ni = row + di;
        const nj = col + dj;
        if (ni >= 0 && ni < rows && nj >= 0 && nj < cols && grid[ni][nj].isBomb) {
          count++;
        }
      }
    }
    return count;
  };

  const revealCell = async (row: number, col: number) => {
    if (gameOver || win || !isGameStarted) return;
    if (grid[row][col].isRevealed || grid[row][col].isFlagged) return;
    
    // If this is the first click, initialize the grid with bombs
    // ensuring the first clicked cell and its surrounding cells are safe
    if (isFirstClickRef.current) {
      const newGrid = initializeGridWithBombs(row, col);
      isFirstClickRef.current = false;
      
      // Reveal only this specific cell for the first click
      newGrid[row][col].isRevealed = true;
      setGrid([...newGrid]);
      
      // Process the first click properly instead of recursively calling
      // Add 1 token for this cell reveal
      let newTokens = 1;
      setGameTokens(newTokens);
      
      // If it's a bonus tile, apply the bonus
      if (newGrid[row][col].isBonus) {
        newTokens = 2; // Double for bonus tile
        toast.success('Bonus tile! Tokens doubled to 2!');
        setGameTokens(2);
      }
      
      // If it's an empty cell (0 adjacent bombs), cascade reveal
      if (newGrid[row][col].adjacentBombs === 0) {
        const revealedBonusTiles = newGrid[row][col].isBonus ? [{row, col}] : [];
        const cascadeResult = await cascadeReveal(newGrid, row, col, newTokens, revealedBonusTiles);
        
        // Now apply all bonus tile multipliers at the end
        if (revealedBonusTiles.length > 0) {
          // Calculate the final token amount with all bonus multipliers
          const multiplier = Math.pow(2, revealedBonusTiles.length);
          const finalTokens = cascadeResult.tokens;
          
          setGameTokens(finalTokens);
          await updateTokensWithAPI(finalTokens);
        } else {
          setGameTokens(cascadeResult.tokens);
          await updateTokensWithAPI(cascadeResult.tokens);
        }
      } else {
        await updateTokensWithAPI(newTokens);
      }
      
      checkWin();
      return;
    }
    
    const newGrid = [...grid];
    newGrid[row][col].isRevealed = true;
    
    if (newGrid[row][col].isBomb) {
      // Reveal all bombs on loss
      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
          if (newGrid[i][j].isBomb) {
            newGrid[i][j].isRevealed = true;
          }
        }
      }
      setGrid(newGrid);
      setGameOver(true);
      toast.error(`Game Over! You lost ${gameTokens} tokens.`);
      setIsGameStarted(false);
      setGameTokens(0);
    } else {
      try {
        // We'll track bonus tiles separately to apply them at the end
        const revealedBonusTiles = [];
        if (newGrid[row][col].isBonus) {
          revealedBonusTiles.push({row, col});
        }
        
        // Add 1 token for this cell reveal
        let newTokens = gameTokens + 1;
        
        // Update the grid
        setGrid([...newGrid]);
        
        // Use cascade logic and track more bonus tiles if found
        if (newGrid[row][col].adjacentBombs === 0) {
          const cascadeResult = await cascadeReveal(newGrid, row, col, newTokens, revealedBonusTiles);
          newTokens = cascadeResult.tokens;
        }
        
        // Now apply all bonus tile multipliers at the end
        if (revealedBonusTiles.length > 0) {
          // Calculate the final token amount with all bonus multipliers
          const multiplier = Math.pow(2, revealedBonusTiles.length);
          const finalTokens = newTokens * multiplier;
          
          // Build a message for the player
          let bonusMessage = 'Bonus tile';
          if (revealedBonusTiles.length > 1) {
            bonusMessage = `${revealedBonusTiles.length} bonus tiles`;
          }
          
          toast.success(`${bonusMessage}! Tokens multiplied by ${multiplier}x to ${finalTokens}!`);
          
          // Update the token count
          newTokens = finalTokens;
        }
        
        setGameTokens(newTokens);
        await updateTokensWithAPI(newTokens);
        
        checkWin();
      } catch (error) {
        console.error('Error revealing cell:', error);
      }
    }
  };
  
  // Function to update tokens count via API
  const updateTokensWithAPI = async (tokenCount: number) => {
    try {
      const response = await fetch('/api/games/crypto-minesweeper', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'set-tokens',
          tokenCount: tokenCount
        }),
      });
      
      if (!response.ok) {
        console.error('Failed to update tokens');
      }
    } catch (error) {
      console.error('API error:', error);
    }
  };
  
  // Recursive function to handle cascading reveals with token counting
  const cascadeReveal = async (grid: Grid, row: number, col: number, currentTokens: number, bonusTiles: {row: number, col: number}[]) => {
    let localTokens = currentTokens;
    let cellsRevealed = 0;
    
    for (let di = -1; di <= 1; di++) {
      for (let dj = -1; dj <= 1; dj++) {
        if (di === 0 && dj === 0) continue;
        
        const ni = row + di;
        const nj = col + dj;
        
        if (ni >= 0 && ni < rows && nj >= 0 && nj < cols && 
            !grid[ni][nj].isRevealed && !grid[ni][nj].isFlagged) {
          
          grid[ni][nj].isRevealed = true;
          cellsRevealed++;
          localTokens++;
          
          // If this is a bonus tile, add it to our tracking array
          if (grid[ni][nj].isBonus) {
            bonusTiles.push({row: ni, col: nj});
          }
          
          // If we revealed another empty cell, continue cascade
          if (grid[ni][nj].adjacentBombs === 0) {
            const result = await cascadeReveal(grid, ni, nj, localTokens, bonusTiles);
            localTokens = result.tokens;
            cellsRevealed += result.revealed;
          }
        }
      }
    }
    
    // After revealing all cells in this cascade step, update the UI
    if (cellsRevealed > 0) {
      setGrid([...grid]);
      
      // Don't update the token counter yet, wait until all bonuses are applied
      
      // Small delay for animation effect
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    return { tokens: localTokens, revealed: cellsRevealed };
  };

  const flagCell = (row: number, col: number) => {
    if (gameOver || win || !isGameStarted) return;
    if (grid[row][col].isRevealed) return;
    const newGrid = [...grid];
    newGrid[row][col].isFlagged = !newGrid[row][col].isFlagged;
    setGrid(newGrid);
  };

  const checkWin = async () => {
    if (hasWonRef.current) return; 

    let won = true;
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        if (!grid[i][j].isBomb && !grid[i][j].isRevealed) {
          won = false;
          break;
        }
      }
      if (!won) break;
    }
    if (won) {
      setWin(true);
      hasWonRef.current = true; 
      try {
        // Cash out winnings
        await cashOut();
        toast.success(`Congratulations! You won and cashed out ${gameTokens} tokens!`);
      } catch (error) {
        console.error('Error processing win:', error);
        toast.error('Error processing win. Please try again.');
      }
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-gray-700 rounded-xl shadow-lg text-white">
      <p className="text-center text-lg mb-4">
        Crypto Sweeper
      </p>
      <p className="text-center text-md mb-4">
        Cost: {GAME_COST} tokens to play. Earn 1 token for each safe cell you reveal!
      </p>
      <button
        onClick={startNewGame}
        disabled={isCashing || (userTokens !== null && userTokens < GAME_COST && !isGameStarted)}
        className={`w-full ${isGameStarted ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-indigo-600 hover:bg-indigo-700'} text-white py-2 rounded-lg mb-4 transition disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {isGameStarted ? `Cash Out (${gameTokens})` : 'New Game'}
      </button>
      {isMobile && isGameStarted && (
        <button
          onClick={() => setIsFlagMode(!isFlagMode)}
          disabled={gameOver || win}
          className={`w-full ${
            isFlagMode ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-indigo-600 hover:bg-indigo-700'
          } text-white py-2 rounded-lg mb-6 transition disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isFlagMode ? 'Exit Flag Mode' : 'Enter Flag Mode'}
        </button>
      )}
      {gameOver && (
        <p className="text-center font-medium mb-4">😢 Game Over!</p>
      )}
      {win && (
        <p className="text-center font-medium mb-4">🎉 You Win!</p>
      )}
      <div className="grid grid-cols-10 gap-2">
        {grid.map((row, i) =>
          row.map((cell, j) => (
            <Cell
              key={`${i}-${j}`}
              cell={cell}
              onClick={() => revealCell(i, j)}
              onRightClick={() => flagCell(i, j)}
              isMobile={isMobile}
              isFlagMode={isFlagMode}
            />
          ))
        )}
      </div>
      <div className="text-center text-sm text-gray-300 mt-4">
        <p className="font-medium">How to Play:</p>
        {isMobile ? (
          <ul className="list-disc list-inside text-left max-w-sm mx-auto">
            <li>Cost: {GAME_COST} tokens to play.</li>
            <li>Tap to reveal a tile.</li>
            <li>Each safe cell you reveal earns you 1 token.</li>
            <li>Orange bonus tiles double your total accumulated tokens!</li>
            <li>Tap the Flag Mode button to toggle flagging suspected bombs.</li>
            <li>Hit a bomb and you lose all your game tokens!</li>
            <li>Cash out anytime to keep your tokens.</li>
            <li>Win by revealing all non-bomb tiles!</li>
          </ul>
        ) : (
          <ul className="list-disc list-inside text-left max-w-sm mx-auto">
            <li>Cost: {GAME_COST} tokens to play.</li>
            <li>Left-click to reveal a tile.</li>
            <li>Each safe cell you reveal earns you 1 token.</li>
            <li>Orange bonus tiles double your total accumulated tokens!</li>
            <li>Right-click to flag suspected bombs.</li>
            <li>Hit a bomb and you lose all your game tokens!</li>
            <li>Cash out anytime to keep your tokens.</li>
            <li>Win by revealing all non-bomb tiles!</li>
          </ul>
        )}
      </div>
    </div>
  );
};

const Cell = ({
  cell,
  onClick,
  onRightClick,
  isMobile,
  isFlagMode,
}: {
  cell: Cell;
  onClick: () => void;
  onRightClick: () => void;
  isMobile: boolean;
  isFlagMode: boolean;
}) => {
  const handleClick = () => {
    if (!cell.isRevealed && !cell.isFlagged) {
      if (isMobile && isFlagMode) {
        onRightClick(); // Flag/unflag in Flag Mode on mobile
      } else {
        onClick(); // Reveal otherwise
      }
    }
  };

  const handleRightClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isMobile && !cell.isRevealed) {
      onRightClick(); // Right-click flagging only on desktop
    }
  };

  let content = '';
  let bgClass = 'bg-gray-600';
  let textClass = 'text-white';

  if (cell.isRevealed) {
    if (cell.isBomb) {
      bgClass = 'bg-gray-800';
      content = '💣';
    } else if (cell.isBonus) {
      bgClass = 'bg-orange-500'; // Orange background for bonus tiles
      if (cell.adjacentBombs > 0) {
        content = cell.adjacentBombs.toString();
        textClass = 'text-white font-bold'; // Make text more visible on orange
      }
    } else {
      bgClass = 'bg-gray-800';
      if (cell.adjacentBombs > 0) {
        content = cell.adjacentBombs.toString();
        // Color-code numbers like traditional Minesweeper
        textClass = {
          1: 'text-blue-400',
          2: 'text-green-400',
          3: 'text-red-400',
          4: 'text-purple-400',
          5: 'text-maroon-400',
          6: 'text-teal-400',
          7: 'text-black',
          8: 'text-gray-400',
        }[cell.adjacentBombs] || 'text-white';
      }
    }
  } else if (cell.isFlagged) {
    content = '🚩';
  }

  return (
    <div
      onClick={handleClick}
      onContextMenu={handleRightClick}
      className={`w-8 h-8 ${bgClass} border border-gray-500 flex items-center justify-center text-sm font-medium ${textClass} cursor-pointer hover:bg-gray-500 transition`}
    >
      {content}
    </div>
  );
};

export default CryptoSweeper;