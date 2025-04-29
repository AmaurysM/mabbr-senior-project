export type GraphPoint = {
    time: number; // seconds
    value: number; // multiplier
  };
  
  export type GameOutcome = "Crashed" | "Sold" | null;
  
  export type GameHistoryEntry = {
    id: number; // Use timestamp or unique ID
    outcome: GameOutcome;
    multiplier: number;
    profit: number;
  };