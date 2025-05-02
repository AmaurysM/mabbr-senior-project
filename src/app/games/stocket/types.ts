export type GraphPoint = {
    time: number;
    value: number;
  };
  
  export type GameOutcome = "Crashed" | "Sold" | null;
  
  export type GameHistoryEntry = {
    id: number;
    outcome: GameOutcome;
    multiplier: number;
    profit: number;
  };