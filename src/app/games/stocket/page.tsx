"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";

import GameDisplay from "./GameDisplay";
import GameControls from "./GameControls";
import GameInfoPanel from "./GameInfoPanel";

import {
    DEFAULT_BET_AMOUNT, MIN_BET_AMOUNT, MAX_BET_AMOUNT,
    GRAPH_UPDATE_THROTTLE, HISTORY_LENGTH, MIN_CRASH_MULTIPLIER,
    GROWTH_RATE_K
} from "./constants";
import { GraphPoint, GameOutcome, GameHistoryEntry } from "./types";
import { formatMultiplier, formatCurrency } from "../../util/formatters";
import { generateCrashPoint } from "../../util/utils";


export default function Stocket() {
    const [hasMounted, setHasMounted] = useState(false);
    const [userBalance, setUserBalance] = useState<number | null>(null);
    const [isLoadingBalance, setIsLoadingBalance] = useState<boolean>(true);
    const [gameActive, setGameActive] = useState<boolean>(false);
    const [gameEnded, setGameEnded] = useState<boolean>(true);
    const [displayValue, setDisplayValue] = useState<number>(1.0);
    const [graphPoints, setGraphPoints] = useState<GraphPoint[]>([{ time: 0, value: 1.0 }]);
    const [endOutcome, setEndOutcome] = useState<GameOutcome>(null);
    const [endValue, setEndValue] = useState<number | null>(null);
    const [roundProfit, setRoundProfit] = useState<number | null>(null);
    const [gameHistory, setGameHistory] = useState<GameHistoryEntry[]>([]);
    const [betAmount, setBetAmount] = useState<number>(DEFAULT_BET_AMOUNT);
    const [sellTime, setSellTime] = useState<number | null>(null);

    const crashPointRef = useRef<number>(MIN_CRASH_MULTIPLIER);
    const startTimeRef = useRef<number>(0);
    const animationFrameRef = useRef<number | null>(null);
    const lastFrameTimeRef = useRef<number>(0);
    const lastGraphUpdateTimeRef = useRef<number>(0);
    const displayValueRef = useRef<number>(displayValue);
    const gameEndedRef = useRef<boolean>(gameEnded);

    useEffect(() => { displayValueRef.current = displayValue; }, [displayValue]);
    useEffect(() => { gameEndedRef.current = gameEnded; }, [gameEnded]);

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
            setUserBalance(0);
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
            await fetchUserBalance();
            return false;
        }
    }, [userBalance, fetchUserBalance]);

    const fetchGameHistory = useCallback(async () => {
        try {
            const res = await fetch("/api/games/stocket/history");
            if (!res.ok) {
                const errorData = await res.text();
                console.error(`Failed to fetch game history: ${res.status} ${errorData}`);
                throw new Error(`Failed to fetch game history: ${res.status}`);
            }
            const data = await res.json();
            if (Array.isArray(data.history)) {
                setGameHistory(data.history.slice(0, HISTORY_LENGTH));
            } else {
                console.warn("Received non-array data for game history:", data);
                setGameHistory([]);
            }
        } catch (err) {
            console.error("Error loading game history:", err);
            //toast.error("Could not load game history.");
        }
    }, []);

    useEffect(() => {
        fetchUserBalance();
        fetchGameHistory();
    }, [fetchUserBalance, fetchGameHistory]);


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

    const canStartGame = useCallback(() => {
        if (isLoadingBalance || userBalance === null) return false;
        return !gameActive && gameEnded && userBalance >= betAmount && betAmount >= MIN_BET_AMOUNT;
    }, [gameActive, gameEnded, userBalance, isLoadingBalance, betAmount]);

    const endGame = useCallback(
        async (outcome: GameOutcome, finalValue: number, userAction: boolean) => {
            const isActiveNow = gameActive;
            const isEndedNow = gameEndedRef.current;
            if (!isActiveNow || isEndedNow) return;

            const currentBetAmount = betAmount;
            const preciseFinalValue = parseFloat(finalValue.toFixed(4));
            const finalElapsedTime = (performance.now() - startTimeRef.current) / 1000;
            const actualCrashValue = crashPointRef.current;

            setGameActive(false);
            setGameEnded(true);
            setEndOutcome(outcome);
            setEndValue(preciseFinalValue);
            setDisplayValue(preciseFinalValue);
            setSellTime(userAction ? finalElapsedTime : null);

            if (animationFrameRef.current) { cancelAnimationFrame(animationFrameRef.current); animationFrameRef.current = null; }

            let finalActualPoints = [...graphPoints];
            const lastPoint = finalActualPoints[finalActualPoints.length - 1];
            if (!lastPoint || Math.abs(lastPoint.time - finalElapsedTime) > 0.01 || Math.abs(lastPoint.value - preciseFinalValue) > 0.001) {
                finalActualPoints.push({ time: Math.max(lastPoint?.time ?? 0, finalElapsedTime), value: preciseFinalValue });
            }

            let theoreticalPoints: GraphPoint[] = [];
            if (outcome === "Sold" && finalElapsedTime < Infinity) { 
                const crashTime = Math.log(actualCrashValue) / GROWTH_RATE_K;
                const step = 0.05;

                let currentTime = finalElapsedTime + step / 2;

                while (currentTime < crashTime) {
                    const theoreticalValue = Math.exp(GROWTH_RATE_K * currentTime);
                    if (theoreticalValue >= actualCrashValue) break;
                    theoreticalPoints.push({ time: currentTime, value: theoreticalValue });
                    currentTime += step;
                }
                if (crashTime > finalElapsedTime + step / 2) {
                    theoreticalPoints.push({ time: crashTime, value: actualCrashValue });
                }
                console.log(`Calculated ${theoreticalPoints.length} theoretical points up to ${crashTime.toFixed(2)}s (Crash Value: ${actualCrashValue})`);
            }

            setGraphPoints([...finalActualPoints, ...theoreticalPoints]);

            let profit = 0;
            if (userAction && outcome === "Sold") profit = currentBetAmount * (preciseFinalValue - 1.0);
            else if (outcome === "Crashed") profit = -currentBetAmount;
            const roundedProfit = parseFloat(profit.toFixed(2));
            setRoundProfit(roundedProfit);

            await updateUserBalance(roundedProfit);

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
                    fetchGameHistory();
                })
                .catch(err => {
                    console.error("Network Error saving game history:", err);
                    fetchGameHistory();
                });

            if (outcome === "Sold") toast.success(`Sold at ${formatMultiplier(preciseFinalValue)}! Profit: ${formatCurrency(roundedProfit, true)}`);
            else toast.error(`Crashed at ${formatMultiplier(preciseFinalValue)}! Lost: ${formatCurrency(currentBetAmount)}`);
        },
        [gameActive, betAmount, updateUserBalance, setGameHistory, setRoundProfit, setEndValue, setDisplayValue, setEndOutcome, setGameActive, setGameEnded, setGraphPoints, graphPoints, fetchGameHistory]
    );

    const startGame = async () => {
        if (!canStartGame()) return;
        const betDeducted = await updateUserBalance(-betAmount);
        if (!betDeducted) { toast.error("Failed to place bet."); return; }

        console.log(`--- Starting game with Bet: ${betAmount} ---`);

        setGameEnded(false);
        setEndOutcome(null);
        setRoundProfit(null);
        setEndValue(null);
        setGraphPoints([{ time: 0, value: 1.0 }]);
        const initialValue = 1.00;
        setDisplayValue(initialValue);
        setSellTime(null);

        displayValueRef.current = initialValue;
        gameEndedRef.current = false;

        crashPointRef.current = generateCrashPoint();
        startTimeRef.current = performance.now();

        lastFrameTimeRef.current = 0;
        lastGraphUpdateTimeRef.current = 0;
        if (animationFrameRef.current) { cancelAnimationFrame(animationFrameRef.current); animationFrameRef.current = null; }

        setGameActive(true);
    };

    const handleAction = () => {
        if (gameActive && !gameEndedRef.current) {
            endGame("Sold", displayValueRef.current, true);
        }
    };


    useEffect(() => {
        const tick = (currentTime: number) => {
            if (gameEndedRef.current || !gameActive) {
                if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
                animationFrameRef.current = null;
                return;
            }
            animationFrameRef.current = requestAnimationFrame(tick);

            if (lastFrameTimeRef.current === 0) {
                lastFrameTimeRef.current = startTimeRef.current;
                lastGraphUpdateTimeRef.current = startTimeRef.current;
            }

            const elapsedTime = (currentTime - startTimeRef.current) / 1000;

            const currentCalculatedValue = Math.max(1.00, Math.exp(GROWTH_RATE_K * elapsedTime));

            if (currentCalculatedValue >= crashPointRef.current) {
                endGame("Crashed", crashPointRef.current, false);
            } else {
                if (Math.abs(currentCalculatedValue - displayValueRef.current) > 0.00001) {
                    setDisplayValue(currentCalculatedValue);
                }

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

            lastFrameTimeRef.current = currentTime;
        };

        if (gameActive) {
            console.log("Game Loop Effect: Starting loop...");
            lastFrameTimeRef.current = 0;
            lastGraphUpdateTimeRef.current = 0;
            animationFrameRef.current = requestAnimationFrame(tick);
        }

        return () => {
            console.log("Game Loop Effect: Cleanup");
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
                animationFrameRef.current = null;
            }
        };
    }, [gameActive, endGame, setDisplayValue, setGraphPoints]);


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