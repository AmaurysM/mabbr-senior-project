"use client";
import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';

interface Cell {
  isBomb: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  adjacentBombs: number;
}

type Grid = Cell[][];

const rows = 10;
const cols = 10;
const BOMB_PROBABILITY = 0.15; // 15% chance of a bomb, adjustable between 0 and 1

const CryptoSweeper = () => {
  const [grid, setGrid] = useState<Grid>([]);
  const [gameOver, setGameOver] = useState(false);
  const [win, setWin] = useState(false);
  const [isNewGameDisabled, setIsNewGameDisabled] = useState(false); // Tracks button disabled state
  const [isMobile, setIsMobile] = useState(false); // Tracks device type
  const [isFlagMode, setIsFlagMode] = useState(false); // Tracks Flag Mode for mobile
  const hasWonRef = useRef(false); // Tracks if win has been processed

  useEffect(() => {
    // Detect mobile device
    const mobileCheck = /Mobi|Android/i.test(navigator.userAgent);
    setIsMobile(mobileCheck);

    // Initialize grid
    initializeGrid();
  }, []);

  const initializeGrid = () => {
    const newGrid: Grid = [];
    for (let i = 0; i < rows; i++) {
      newGrid[i] = [];
      for (let j = 0; j < cols; j++) {
        const isBomb = Math.random() < BOMB_PROBABILITY;
        newGrid[i][j] = {
          isBomb,
          isRevealed: false,
          isFlagged: false,
          adjacentBombs: 0,
        };
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
    setGrid(newGrid);
    setGameOver(false);
    setWin(false);
    setIsNewGameDisabled(false); // Reset button state
    setIsFlagMode(false); // Reset Flag Mode
    hasWonRef.current = false; // Reset win flag
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

  const revealCell = (row: number, col: number) => {
    if (gameOver || win) return;
    if (grid[row][col].isRevealed || grid[row][col].isFlagged) return;
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
    } else {
      if (newGrid[row][col].adjacentBombs === 0) {
        // Reveal adjacent cells
        for (let di = -1; di <= 1; di++) {
          for (let dj = -1; dj <= 1; dj++) {
            const ni = row + di;
            const nj = col + dj;
            if (ni >= 0 && ni < rows && nj >= 0 && nj < cols) {
              revealCell(ni, nj);
            }
          }
        }
      }
      setGrid(newGrid);
      checkWin();
    }
  };

  const flagCell = (row: number, col: number) => {
    if (gameOver || win) return;
    if (grid[row][col].isRevealed) return;
    const newGrid = [...grid];
    newGrid[row][col].isFlagged = !newGrid[row][col].isFlagged;
    setGrid(newGrid);
  };

  const checkWin = async () => {
    if (hasWonRef.current) return; // Prevent multiple win processing

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
      hasWonRef.current = true; // Mark win as processed
      try {
        // Make API call
        const bonusResponse = await fetch('/api/user/loginBonus', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });

        if (!bonusResponse.ok) {
          console.error('LoginBonus failed:', bonusResponse.status, bonusResponse.statusText);
          throw new Error('Failed to apply login bonus');
        }

        const bonusData = await bonusResponse.json();

        // Show toast after API call with token count
        toast.success(`Success: You beat Crypto Sweeper! You earned 50 tokens. Current tokens: ${bonusData.tokenCount}`);

        // Disable New Game button before delay
        setIsNewGameDisabled(true);

        // Delay for 3 seconds before refreshing
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Refresh page
        window.location.reload();
      } catch (error) {
        console.error('Error awarding token:', error);
        toast.error('Error: Failed to award token. Please try again.');
      }
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-gray-700 rounded-xl shadow-lg text-white">
      <p className="text-center text-lg mb-4">
        Crypto Sweeper
      </p>
      <p className="text-center text-md mb-4">
        Free to play! Win to earn 50 tokens! Good luck.
      </p>
      <button
        onClick={initializeGrid}
        disabled={isNewGameDisabled}
        className={`w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg mb-4 transition disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        New Game
      </button>
      {isMobile && (
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
          <ul className="list-disc list-inside text-left max-w-xs mx-auto">
            <li>Tap to reveal a tile.</li>
            <li>Tap the Flag Mode button to toggle flagging, then tap tiles to flag suspected bombs.</li>
            <li>Avoid revealing bombs to stay in the game.</li>
            <li>Win by revealing all non-bomb tiles to earn 50 tokens!</li>
          </ul>
        ) : (
          <ul className="list-disc list-inside text-left max-w-xs mx-auto">
            <li>Left-click to reveal a tile.</li>
            <li>Right-click to flag suspected bombs.</li>
            <li>Avoid revealing bombs to stay in the game.</li>
            <li>Win by revealing all non-bomb tiles to earn 50 tokens!</li>
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
    bgClass = 'bg-gray-800';
    if (cell.isBomb) {
      content = '💣';
    } else if (cell.adjacentBombs > 0) {
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