"use client";
import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';

interface Cell {
  isBomb: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  adjacentBombs: number;
  isBonus?: boolean;
  bonusMultiplier?: number;
}

type Grid = Cell[][];

const rows = 10;
const cols = 10;
const GAME_COST = 25;
const MIN_BOMB_PROBABILITY = 0.15;
const MAX_BOMB_PROBABILITY = 0.90;
const MIN_BONUS_CHANCE = 0.01;
const MAX_BONUS_CHANCE = 0.06;

const BONUS_MULTIPLIERS = [2, 3, 5];
const SPECIAL_EVENT_CHANCE = 0.05;

const CryptoSweeper = () => {
  //const  [bonusTiles, setBonusTiles] = useState(0);
  const [grid, setGrid] = useState<Grid>([]);
  const [gameOver, setGameOver] = useState(false);
  const [win, setWin] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isFlagMode, setIsFlagMode] = useState(false);
  const [userTokens, setUserTokens] = useState<number | null>(null);
  const [gameTokens, setGameTokens] = useState(0);
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [isCashing, setIsCashing] = useState(false);
  const [currentDifficulty, setCurrentDifficulty] = useState(0);
  const [streakCount, setStreakCount] = useState(0);
  const [specialEvent, setSpecialEvent] = useState<string | null>(null);
  const [bombProbability, setBombProbability] = useState(0.25);
  const [bonusTileChance, setBonusTileChance] = useState(0.03);
  const [potentialCashout, setPotentialCashout] = useState(0);
  const hasWonRef = useRef(false);
  const isFirstClickRef = useRef(true);
  const gamesPlayedRef = useRef(0);

  useEffect(() => {
    const mobileCheck = /Mobi|Android/i.test(navigator.userAgent);
    setIsMobile(mobileCheck);

    fetchUserTokens();

    initializeEmptyGrid();

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

  // Calculate potential cashout value whenever gameTokens changes
  useEffect(() => {
    // Calculate win bonus based on difficulty (bomb probability)
    if (isGameStarted) {
      // Calculate potential difficulty bonus that would be applied if player wins
      const difficultyBonus = Math.floor(bombProbability * 100);
      // But don't apply it yet since they haven't won
      setPotentialCashout(gameTokens);
    } else {
      setPotentialCashout(0);
    }
  }, [gameTokens, bombProbability, isGameStarted]);

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

  // Generate random game parameters for each new game
  const generateGameParameters = () => {
    // Random bomb probability between MIN and MAX
    const newBombProbability = MIN_BOMB_PROBABILITY +
      Math.random() * (MAX_BOMB_PROBABILITY - MIN_BOMB_PROBABILITY);

    // Random bonus tile chance between MIN and MAX
    const newBonusTileChance = MIN_BONUS_CHANCE +
      Math.random() * (MAX_BONUS_CHANCE - MIN_BONUS_CHANCE);

    setBombProbability(newBombProbability);
    setBonusTileChance(newBonusTileChance);

    // Determine if this game has a special event
    if (Math.random() < SPECIAL_EVENT_CHANCE) {
      triggerSpecialEvent();
    } else {
      setSpecialEvent(null);
    }
  };

  // Special events to make gameplay more exciting
  const triggerSpecialEvent = () => {
    const events = [
      { name: "Lucky Streak", effect: "All bonus tiles have 5x multiplier!" },
      { name: "Safe Path", effect: "First three revealed cells guaranteed safe!" },
      { name: "Bonus Bonanza", effect: "Doubled bonus tile frequency!" },
      { name: "Jackpot Mode", effect: "One super bonus tile worth 10x!" }
    ];

    const selectedEvent = events[Math.floor(Math.random() * events.length)];
    setSpecialEvent(selectedEvent.name);

    // Apply the event effect
    switch (selectedEvent.name) {
      case "Bonus Bonanza":
        setBonusTileChance(bonusTileChance * 2);
        break;
      case "Lucky Streak":
        // Effect will be handled during tile reveal
        break;
      case "Jackpot Mode":
        // Effect will be handled during grid initialization
        break;
      case "Safe Path":
        // Effect will be handled during first clicks
        break;
    }

    toast.success(`🎰 Special Event: ${selectedEvent.name} - ${selectedEvent.effect}`);
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

      // Generate new random parameters for this game
      generateGameParameters();

      // Increment games played counter
      gamesPlayedRef.current += 1;

      // Reset game state
      setGameTokens(0);
      setPotentialCashout(0);
      initializeEmptyGrid();
      setIsGameStarted(true);
      setGameOver(false);
      setWin(false);
      hasWonRef.current = false;
      isFirstClickRef.current = true;

      toast.success(`Game started! ${GAME_COST} tokens deducted. Good luck!`);
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
      setPotentialCashout(0);
      setStreakCount(0);

      // Initialize an empty grid
      initializeEmptyGrid();

      toast.success(`Successfully cashed out ${gameTokens} tokens!`);
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

    const safeRadius = specialEvent === "Safe Path" ? 2 : 1;

    let bombsPlaced = 0;
    const totalCells = rows * cols;
    const targetBombs = Math.floor(totalCells * bombProbability);

    while (bombsPlaced < targetBombs) {
      const i = Math.floor(Math.random() * rows);
      const j = Math.floor(Math.random() * cols);

      // Skip the safe area around first click
      if (Math.abs(i - firstRow) <= safeRadius && Math.abs(j - firstCol) <= safeRadius) {
        continue;
      }

      // If this cell doesn't already have a bomb, place one
      if (!newGrid[i][j].isBomb) {
        newGrid[i][j].isBomb = true;
        bombsPlaced++;
      }
    }

    // Add bonus tiles to non-bomb cells with varying multipliers
    let hasJackpot = false;
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        if (!newGrid[i][j].isBomb) {
          // Check if we should add a bonus tile
          if (Math.random() < bonusTileChance) {
            newGrid[i][j].isBonus = true;

            // Determine multiplier
            if (specialEvent === "Lucky Streak") {
              // All bonus tiles have 5x multiplier in Lucky Streak event
              newGrid[i][j].bonusMultiplier = 5;
            } else if (specialEvent === "Jackpot Mode" && !hasJackpot) {
              // Add one super jackpot tile worth 10x
              newGrid[i][j].bonusMultiplier = 10;
              hasJackpot = true;
            } else {
              newGrid[i][j].bonusMultiplier = BONUS_MULTIPLIERS[0];
            }
          }
        }
      }
    }

    // If we're in Jackpot Mode but didn't place a jackpot, force one in a random safe cell
    if (specialEvent === "Jackpot Mode" && !hasJackpot) {
      let attempts = 0;
      while (!hasJackpot && attempts < 50) {
        const i = Math.floor(Math.random() * rows);
        const j = Math.floor(Math.random() * cols);

        if (!newGrid[i][j].isBomb &&
          (Math.abs(i - firstRow) > 2 || Math.abs(j - firstCol) > 2)) {
          newGrid[i][j].isBonus = true;
          newGrid[i][j].bonusMultiplier = 10;
          hasJackpot = true;
        }
        attempts++;
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

    if (isFirstClickRef.current) {
      const newGrid = initializeGridWithBombs(row, col);
      isFirstClickRef.current = false;

      newGrid[row][col].isRevealed = true;
      setGrid([...newGrid]);

      let newTokens = 1; 
      const bonusTiles = [];

      if (newGrid[row][col].isBonus) {
        const multiplier = newGrid[row][col].bonusMultiplier || 2;
        bonusTiles.push({ row, col, multiplier });
        toast.success(`🎯 Bonus tile! ${multiplier}x multiplier!`);
      }

      if (newGrid[row][col].adjacentBombs === 0) {
        const cascadeResult = await cascadeReveal(newGrid, row, col, newTokens, bonusTiles);
        newTokens = cascadeResult.tokens;
      }

      if (bonusTiles.length > 0) {
        let totalMultiplier = 1;
        bonusTiles.forEach(tile => {
          totalMultiplier *= tile.multiplier;
        });
        newTokens = Math.floor(newTokens * totalMultiplier);
      }

      setGameTokens(newTokens);
      await updateTokensWithAPI(newTokens);

      // Update streak count
      setStreakCount(prev => prev + 1);

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
      setStreakCount(0);

      toast.error(`💣 BOOM! Game Over! You lost ${gameTokens} tokens.`);
      setIsGameStarted(false);
      setGameTokens(0);
      setPotentialCashout(0);
    } else {
      try {
        // We'll track bonus tiles separately
        const bonusTiles = [];
        if (newGrid[row][col].isBonus) {
          bonusTiles.push({
            row,
            col,
            multiplier: newGrid[row][col].bonusMultiplier || 2
          });
        }

        // Add 1 token for this cell reveal
        let newTokens = gameTokens + 1;

        // Update the grid
        setGrid([...newGrid]);

        // Increment streak
        const newStreak = streakCount + 1;
        setStreakCount(newStreak);

        // Give streak bonuses
        if (newStreak % 5 === 0) {
          newTokens += Math.floor(newStreak / 5); // Bonus tokens for streaks
          toast.success(`🔥 ${newStreak} cell streak! +${Math.floor(newStreak / 5)} bonus tokens!`);
        }

        // Use cascade logic and track more bonus tiles if found
        if (newGrid[row][col].adjacentBombs === 0) {
          const cascadeResult = await cascadeReveal(newGrid, row, col, newTokens, bonusTiles);
          newTokens = cascadeResult.tokens;
        }
        console.log("------------" + bonusTiles[0])

        // Apply bonus tile effects
        if (bonusTiles.length > 0) {
          let totalMultiplier = 1;
          bonusTiles.forEach(tile => {
            totalMultiplier *= tile.multiplier;
          });

          if (totalMultiplier > 1) {
            const originalTokens = newTokens;
            newTokens = Math.floor(newTokens * totalMultiplier);

            // Build a message for the player
            let bonusMessage = `💰 Bonus tile! ${totalMultiplier}x multiplier!`;
            if (bonusTiles.length > 1) {
              bonusMessage = `💰 ${bonusTiles.length} bonus tiles! Combined ${totalMultiplier}x multiplier!`;
            }

            toast.success(`${bonusMessage} Tokens: ${originalTokens} → ${newTokens}!`);
          }
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
  const cascadeReveal = async (grid: Grid, row: number, col: number, currentTokens: number, bonusTiles: { row: number, col: number, multiplier: number }[]) => {
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
            bonusTiles.push({
              row: ni,
              col: nj,
              multiplier: grid[ni][nj].bonusMultiplier || 2
            });
          }

          // If we revealed another empty cell, continue cascade
          if (grid[ni][nj].adjacentBombs === 0) {
            const result = await cascadeReveal(grid, ni, nj, localTokens, bonusTiles);
            localTokens = result.tokens;
            cellsRevealed += result.revealed;
            //setBonusTiles(result.b)
          }
        }
      }
    }

    // After revealing all cells in this cascade step, update the UI
    if (cellsRevealed > 0) {
      setGrid([...grid]);
      setStreakCount(prev => prev + cellsRevealed);

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

      // Calculate win bonus based on difficulty (bomb probability)
      const difficultyBonus = Math.floor(bombProbability * 100);
      const winBonus = difficultyBonus;

      const finalTokens = gameTokens + winBonus;

      try {
        // Update tokens with win bonus first
        setGameTokens(finalTokens);
        await updateTokensWithAPI(finalTokens);

        // Then cash out
        await cashOut();
        toast.success(`🏆 JACKPOT! You cleared the board! +${winBonus} bonus tokens! Total: ${finalTokens} tokens!`);
      } catch (error) {
        console.error('Error processing win:', error);
        toast.error('Error processing win. Please try again.');
      }
    }
  };

  return (
    <div className="max-w-full p-6 bg-gray-900 rounded-2xl shadow-xl text-white space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-extrabold">🎰 Stock Sweeper 🎰</h1>

        {specialEvent && (
          <div className="bg-yellow-500 text-black px-4 py-1 rounded-full text-sm inline-block animate-pulse">
            🌟 Special Event: {specialEvent} 🌟
          </div>
        )}

        <p className="text-gray-400 text-sm">Cost: {GAME_COST} tokens to play</p>
      </div>

      {/* Game Stats */}
      <div className="flex flex-wrap justify-between gap-3">
        <div className="bg-gray-800 px-4 py-2 rounded-lg flex-1 text-center">
          <p className="text-yellow-400 font-medium">💰 Tokens</p>
          <p className="font-bold text-lg">{isGameStarted ? gameTokens : userTokens || 0}</p>
        </div>

        {isGameStarted && (
          <>
            <div className="bg-gray-800 px-4 py-2 rounded-lg flex-1 text-center">
              <p className="text-red-400 font-medium">💣 Risk</p>
              <p className="font-bold text-lg">{Math.round(bombProbability * 100)}%</p>
            </div>

            <div className="bg-gray-800 px-4 py-2 rounded-lg flex-1 text-center">
              <p className="text-green-400 font-medium">🔥 Streak</p>
              <p className="font-bold text-lg">{streakCount}</p>
            </div>
          </>
        )}
      </div>

      {/* Game Buttons */}
      <div className="space-y-4">
        <button
          onClick={startNewGame}
          disabled={isCashing || (userTokens !== null && userTokens < GAME_COST && !isGameStarted)}
          className={`w-full ${isGameStarted ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-indigo-600 hover:bg-indigo-700'
            } text-white py-3 rounded-lg text-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isGameStarted ? `💰 Cash Out (${potentialCashout} tokens)` : '🎮 New Game'}
        </button>

        {isMobile && isGameStarted && (
          <button
            onClick={() => setIsFlagMode(!isFlagMode)}
            disabled={gameOver || win}
            className={`w-full ${isFlagMode ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
              } text-white py-3 rounded-lg text-base font-medium transition disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isFlagMode ? '🚩 Exit Flag Mode' : '🚩 Enter Flag Mode'}
          </button>
        )}
      </div>

      {/* Game State Messages */}
      {gameOver && (
        <p className="text-center text-red-500 font-semibold text-lg">💣 BOOM! Game Over!</p>
      )}
      {win && (
        <p className="text-center text-green-500 font-semibold text-lg">🎉 JACKPOT! You Win!</p>
      )}

      {/* Main Game Area */}
      <div className="flex flex-col md:flex-row gap-6">
        <div className="grid grid-cols-10 gap-1">
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

        {/* How to Play */}
        <div className="text-sm text-gray-300 max-w-sm space-y-2">
          <h2 className="font-semibold text-yellow-400">💎 How to Play:</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>Each game costs {GAME_COST} tokens to play</li>
            <li>Every safe cell earns you 1 token</li>
            <li>Colored bonus tiles multiply your tokens!</li>
            <li>
              {isMobile ? 'Tap' : 'Click'} to reveal, {isMobile ? 'use Flag Mode' : 'right-click'} to
              flag bombs
            </li>
            <li>Cash out anytime to keep your tokens</li>
            <li>Longer streaks earn bonus tokens!</li>
            <li>Special events add exciting bonuses and challenges</li>
            <li>Clear the board for a difficulty bonus!</li>
          </ul>
        </div>
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
  let bgClass = 'bg-gray-600 hover:bg-gray-500';
  let textClass = 'text-white';

  const multiplierColors: { [key: number]: string } = {
    2: 'bg-orange-500',
    3: 'bg-purple-500',
    5: 'bg-pink-500',
    10: 'bg-yellow-400'
  };

  if (cell.isRevealed) {
    if (cell.isBomb) {
      bgClass = 'bg-red-600';

      content = '💣';
    } else if (cell.isBonus) {
      bgClass = 'bg-orange-500';
      if (cell.adjacentBombs > 0) {
        content = cell.adjacentBombs.toString();
        textClass = 'text-white font-bold'; // Make text more visible on orange
      }
    } else {
      if (cell.isBonus) {
        bgClass = multiplierColors[cell.adjacentBombs];
      } else {
        bgClass = 'bg-gray-800';

      }

      if (cell.adjacentBombs > 0) {
        content = cell.adjacentBombs.toString();
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