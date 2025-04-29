// src/app/games/stocket/page.tsx
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";

// --- Child Component Imports ---
// Adjust paths as necessary for your project structure
import GameDisplay from "./GameDisplay";
import GameControls from "./GameControls";
import GameInfoPanel from "./GameInfoPanel";

// --- Constants, Types, Helpers ---
// Adjust paths as necessary
import {
    DEFAULT_BET_AMOUNT, MIN_BET_AMOUNT, MAX_BET_AMOUNT,
    GRAPH_UPDATE_THROTTLE, HISTORY_LENGTH, MIN_CRASH_MULTIPLIER,
    GROWTH_RATE_K // Growth rate constant for exponential formula
} from "./constants";
import { GraphPoint, GameOutcome, GameHistoryEntry } from "./types";
import { formatMultiplier, formatCurrency } from "../../util/formatters"; // Adjust path
import { generateCrashPoint } from "../../util/utils"; // Adjust path


// --- Main Component ---
export default function Stocket() {
    // --- State ---
    const [hasMounted, setHasMounted] = useState(false); // For hydration fix
    const [userBalance, setUserBalance] = useState<number | null>(null);
    const [isLoadingBalance, setIsLoadingBalance] = useState<boolean>(true);
    const [gameActive, setGameActive] = useState<boolean>(false);
    const [gameEnded, setGameEnded] = useState<boolean>(true);
    const [displayValue, setDisplayValue] = useState<number>(1.0);
    const [graphPoints, setGraphPoints] = useState<GraphPoint[]>([{ time: 0, value: 1.0 }]);
    const [endOutcome, setEndOutcome] = useState<GameOutcome>(null);
    const [endValue, setEndValue] = useState<number | null>(null); // Actual value at end (sell or crash)
    const [roundProfit, setRoundProfit] = useState<number | null>(null);
    const [gameHistory, setGameHistory] = useState<GameHistoryEntry[]>([]);
    const [betAmount, setBetAmount] = useState<number>(DEFAULT_BET_AMOUNT);
    // State to store the time user sold (null if crashed or not ended)
    const [sellTime, setSellTime] = useState<number | null>(null);

    // --- Refs ---
    const crashPointRef = useRef<number>(MIN_CRASH_MULTIPLIER);
    const startTimeRef = useRef<number>(0);
    const animationFrameRef = useRef<number | null>(null);
    const lastFrameTimeRef = useRef<number>(0);
    const lastGraphUpdateTimeRef = useRef<number>(0);
    const displayValueRef = useRef<number>(displayValue);
    const gameEndedRef = useRef<boolean>(gameEnded);

    // Keep refs synchronized with state changes
    useEffect(() => { displayValueRef.current = displayValue; }, [displayValue]);
    useEffect(() => { gameEndedRef.current = gameEnded; }, [gameEnded]);


    // --- API Calls & Hydration Fix ---
    useEffect(() => { setHasMounted(true); }, []);

    const fetchUserBalance = useCallback(async () => {
        setIsLoadingBalance(true);
        try {
            const res = await fetch("/api/user/portfolio", { credentials: "include" });
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            const data = await res.json();
            if (typeof data.balance === "number") setUserBalance(data.balance);
            else throw new Error("Invalid balance data received");
        } catch (err) {
            console.error("Error fetching balance:", err);
            toast.error("Failed to fetch balance.");
            setUserBalance(0); // Set default on error
        } finally {
            setIsLoadingBalance(false);
        }
    }, []);

    const updateUserBalance = useCallback(async (amount: number): Promise<boolean> => {
        if (userBalance === null) return false;
        try {
            const res = await fetch("/api/user/portfolio", {
                method: "PUT",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ increment: amount }),
            });
            if (!res.ok) {
                let errorMsg = `HTTP error! status: ${res.status}`;
                try { const d = await res.json(); errorMsg = d.message || errorMsg; } catch (e) {}
                throw new Error(errorMsg);
            }
            const data = await res.json();
            if (typeof data.balance === "number") {
                setUserBalance(data.balance);
                return true;
            } else throw new Error("Invalid balance data received after update");
        } catch (err) {
            console.error("Error updating balance:", err);
            toast.error(`Failed to update balance: ${err instanceof Error ? err.message : "Unknown error"}`);
            await fetchUserBalance(); // Refetch on error
            return false;
        }
    }, [userBalance, fetchUserBalance]);

    // Fetch history function
    const fetchGameHistory = useCallback(async () => {
        try {
            const res = await fetch("/api/games/stocket/history"); // Adjust path if needed
            if (!res.ok) {
                const errorData = await res.text(); // Get more info on error
                console.error(`Failed to fetch game history: ${res.status} ${errorData}`); // Log detailed error
                throw new Error(`Failed to fetch game history: ${res.status}`); // Throw generic error
            }
            const data = await res.json();
            if (Array.isArray(data.history)) {
                setGameHistory(data.history.slice(0, HISTORY_LENGTH));
            } else {
                console.warn("Received non-array data for game history:", data);
                setGameHistory([]); // Reset to empty array if data is invalid
            }
        } catch (err) {
            console.error("Error loading game history:", err);
            // Optional: toast.error("Could not load game history.");
        }
    }, []); // No dependencies needed if it's static

    // Effect to fetch initial data
    useEffect(() => {
        fetchUserBalance();
        fetchGameHistory();
    }, [fetchUserBalance, fetchGameHistory]); // Call both on mount


    // --- Bet Amount Handler ---
    const handleBetAmountChange = (newAmountStr: string) => {
        if (gameActive) return;
        let newAmount = parseFloat(newAmountStr);
        if (isNaN(newAmount) || newAmountStr.trim() === '') {
            setBetAmount(MIN_BET_AMOUNT);
            return;
        }
        newAmount = Math.max(MIN_BET_AMOUNT, Math.min(MAX_BET_AMOUNT, newAmount));
        newAmount = parseFloat(newAmount.toFixed(2));
        setBetAmount(newAmount);
    };

    // --- Game Control Functions ---
    const canStartGame = useCallback(() => {
        if (isLoadingBalance || userBalance === null) return false;
        return !gameActive && gameEnded && userBalance >= betAmount && betAmount >= MIN_BET_AMOUNT;
    }, [gameActive, gameEnded, userBalance, isLoadingBalance, betAmount]);

    const endGame = useCallback(
        async (outcome: GameOutcome, finalValue: number, userAction: boolean) => {
            const isActiveNow = gameActive; // Read state at start of function call
            const isEndedNow = gameEndedRef.current; // Read ref for most current value
            if (!isActiveNow || isEndedNow) return; // Prevent multiple calls

            const currentBetAmount = betAmount; // Capture bet amount for this round
            const preciseFinalValue = parseFloat(finalValue.toFixed(4));
            const finalElapsedTime = (performance.now() - startTimeRef.current) / 1000;
            const actualCrashValue = crashPointRef.current; // Capture crash point for this round

            // --- Set Core End State FIRST ---
            setGameActive(false); // Stops the loop via useEffect cleanup
            setGameEnded(true);
            setEndOutcome(outcome);
            setEndValue(preciseFinalValue); // The value where the game actually stopped
            setDisplayValue(preciseFinalValue); // Update visual display
            setSellTime(userAction ? finalElapsedTime : null); // Record sell time only if user sold

            // Cancel animation frame just in case cleanup hasn't run
            if (animationFrameRef.current) { cancelAnimationFrame(animationFrameRef.current); animationFrameRef.current = null; }

            // --- Calculate Final Actual Graph Point ---
            // Get the points accumulated *during* the game loop
            let finalActualPoints = [...graphPoints];
            const lastPoint = finalActualPoints[finalActualPoints.length - 1];
            // Add the precise end point if it's significantly different from the last throttled point
            if (!lastPoint || Math.abs(lastPoint.time - finalElapsedTime) > 0.01 || Math.abs(lastPoint.value - preciseFinalValue) > 0.001) {
                finalActualPoints.push({ time: Math.max(lastPoint?.time ?? 0, finalElapsedTime), value: preciseFinalValue });
            }

            // --- Calculate Theoretical Points (ONLY if user Sold) ---
            let theoreticalPoints: GraphPoint[] = [];
            if (outcome === "Sold" && finalElapsedTime < Infinity) { // Check finalElapsedTime is valid
                // Calculate time at which crash would have occurred using inverse of exponential function
                const crashTime = Math.log(actualCrashValue) / GROWTH_RATE_K;
                const step = 0.05; // Time step for theoretical points (in seconds)

                // Start calculation slightly *after* the sell time
                let currentTime = finalElapsedTime + step / 2; // Start halfway into the first step

                while (currentTime < crashTime) {
                    const theoreticalValue = Math.exp(GROWTH_RATE_K * currentTime);
                    // Stop if somehow value exceeds crash point early (safety check)
                    if (theoreticalValue >= actualCrashValue) break;
                    theoreticalPoints.push({ time: currentTime, value: theoreticalValue });
                    currentTime += step;
                }
                // Add the exact crash point at the calculated crash time
                // Ensure crash point isn't added if crashTime is very close to sellTime
                if (crashTime > finalElapsedTime + step / 2) {
                    theoreticalPoints.push({ time: crashTime, value: actualCrashValue });
                }
                console.log(`Calculated ${theoreticalPoints.length} theoretical points up to ${crashTime.toFixed(2)}s (Crash Value: ${actualCrashValue})`);
            }

            // --- Update Graph Points State with Actual + Theoretical (if any) ---
            // This triggers the re-render of GameDisplay with the full path data
            setGraphPoints([...finalActualPoints, ...theoreticalPoints]);

            // --- Profit, Balance, History, Toast ---
            let profit = 0;
            if (userAction && outcome === "Sold") profit = currentBetAmount * (preciseFinalValue - 1.0);
            else if (outcome === "Crashed") profit = -currentBetAmount;
            const roundedProfit = parseFloat(profit.toFixed(2));
            setRoundProfit(roundedProfit);

            // Update balance after calculating profit
            await updateUserBalance(roundedProfit);

            // Save game result to DB (fire and forget, handle errors silently or with minimal toast)
            fetch("/api/games/stocket/history", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    outcome,
                    multiplier: parseFloat(preciseFinalValue.toFixed(2)),
                    profit: roundedProfit,
                    betAmount: currentBetAmount
                })
            })
                .then(res => {
                    if (!res.ok) { console.error("API Error saving game history:", res.status, res.statusText); }
                    // Refresh history list after saving attempt (success or fail)
                    fetchGameHistory();
                })
                .catch(err => {
                    console.error("Network Error saving game history:", err);
                    // Optionally refresh history even on network error
                    fetchGameHistory();
                });


            // Show result toast
            if (outcome === "Sold") toast.success(`Sold at ${formatMultiplier(preciseFinalValue)}! Profit: ${formatCurrency(roundedProfit, true)}`);
            else toast.error(`Crashed at ${formatMultiplier(preciseFinalValue)}! Lost: ${formatCurrency(currentBetAmount)}`);
        },
        // Dependencies - ensure all state/props/functions used inside are listed
        [gameActive, betAmount, updateUserBalance, setGameHistory, setRoundProfit, setEndValue, setDisplayValue, setEndOutcome, setGameActive, setGameEnded, setGraphPoints, graphPoints, fetchGameHistory]
    );

    const startGame = async () => {
        if (!canStartGame()) return;
        const betDeducted = await updateUserBalance(-betAmount);
        if (!betDeducted) { toast.error("Failed to place bet."); return; }

        console.log(`--- Starting game with Bet: ${betAmount} ---`);

        // Reset state for a new game
        setGameEnded(false);
        setEndOutcome(null);
        setRoundProfit(null);
        setEndValue(null);
        setGraphPoints([{ time: 0, value: 1.0 }]); // Start with base point
        const initialValue = 1.00; // Start calculation from 1.00
        setDisplayValue(initialValue);
        setSellTime(null); // Reset sell time

        // Sync refs
        displayValueRef.current = initialValue;
        gameEndedRef.current = false;

        // Setup new round parameters
        crashPointRef.current = generateCrashPoint();
        startTimeRef.current = performance.now();

        // Reset loop timers
        lastFrameTimeRef.current = 0;
        lastGraphUpdateTimeRef.current = 0;
        if (animationFrameRef.current) { cancelAnimationFrame(animationFrameRef.current); animationFrameRef.current = null; }

        // Set gameActive = true LAST to trigger the loop effect
        setGameActive(true);
    };

    const handleAction = () => { // "Sell Now" button
        if (gameActive && !gameEndedRef.current) {
            // Pass the current multiplier value from the ref at the moment of click
            endGame("Sold", displayValueRef.current, true);
        }
    };


    // --- Game Loop Effect [gameActive] ---
    useEffect(() => {
        const tick = (currentTime: number) => {
            // Guard clauses
            if (gameEndedRef.current || !gameActive) {
                if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
                animationFrameRef.current = null;
                return;
            }
            // Schedule next frame immediately
            animationFrameRef.current = requestAnimationFrame(tick);

            // Initialize timers on first valid frame
            if (lastFrameTimeRef.current === 0) {
                lastFrameTimeRef.current = startTimeRef.current; // Use start time as base
                lastGraphUpdateTimeRef.current = startTimeRef.current;
            }

            const elapsedTime = (currentTime - startTimeRef.current) / 1000;

            // Calculate multiplier using exponential formula
            const currentCalculatedValue = Math.max(1.00, Math.exp(GROWTH_RATE_K * elapsedTime));

            // Check for crash condition
            if (currentCalculatedValue >= crashPointRef.current) {
                endGame("Crashed", crashPointRef.current, false); // endGame handles stopping loop
            } else {
                // No crash - Update display state if value changed
                if (Math.abs(currentCalculatedValue - displayValueRef.current) > 0.00001) {
                    setDisplayValue(currentCalculatedValue);
                }

                // Update graph points based on throttle
                const timeSinceLastGraphUpdate = currentTime - lastGraphUpdateTimeRef.current;
                if (timeSinceLastGraphUpdate >= GRAPH_UPDATE_THROTTLE || (elapsedTime > 0.01 && graphPoints.length < 2) ) {
                    setGraphPoints(prev => {
                        const newPoint = { time: elapsedTime, value: currentCalculatedValue };
                        if (prev.length > 0 && Math.abs(prev[prev.length - 1].time - elapsedTime) < 0.05) return prev;
                        return [...prev, newPoint];
                    });
                    lastGraphUpdateTimeRef.current = currentTime;
                }
            }

            // Update last frame time for next delta calculation
            lastFrameTimeRef.current = currentTime;
        };

        // Start loop if game becomes active
        if (gameActive) {
            console.log("Game Loop Effect: Starting loop...");
            lastFrameTimeRef.current = 0; // Reset timer for the new game
            lastGraphUpdateTimeRef.current = 0;
            animationFrameRef.current = requestAnimationFrame(tick);
        }

        // Cleanup function: stops the loop if gameActive becomes false or component unmounts
        return () => {
            console.log("Game Loop Effect: Cleanup");
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
                animationFrameRef.current = null;
            }
        };
        // Dependencies for the effect managing the loop
    }, [gameActive, endGame, setDisplayValue, setGraphPoints]); // Include setters called inside tick


    // --- Render ---
    return (
        <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-white mb-4">Stocket</h1>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 flex flex-col space-y-4">
                    <GameDisplay
                        graphPoints={graphPoints}
                        currentValue={displayValue}
                        gameActive={gameActive}
                        gameEnded={gameEnded}
                        endOutcome={endOutcome}
                        endValue={endValue}
                        roundProfit={roundProfit}
                        // Pass sellTime and the actual crash value for this round
                        sellTime={sellTime}
                        crashValue={crashPointRef.current}
                    />
                    <GameControls
                        userBalance={userBalance}
                        isLoadingBalance={isLoadingBalance}
                        gameActive={gameActive}
                        gameEnded={gameEnded}
                        canStart={canStartGame()}
                        currentMultiplier={displayValue}
                        onStart={startGame}
                        onSell={handleAction}
                        hasMounted={hasMounted}
                        betAmount={betAmount}
                        onBetAmountChange={handleBetAmountChange}
                        minBet={MIN_BET_AMOUNT}
                        maxBet={MAX_BET_AMOUNT}
                    />
                </div>
                <div className="lg:col-span-1">
                    <GameInfoPanel gameHistory={gameHistory} />
                </div>
            </div>
        </div>
    );
}