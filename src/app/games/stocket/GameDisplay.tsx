// src/games/stocket/GameDisplay.tsx
import React, { useRef, useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Tooltip,
    ChartOptions,
    ChartData,
    Filler, // Needed for background fill
    Chart, // Type used for chart instance ref
} from "chart.js";
import { GraphPoint, GameOutcome } from "./types"; // Adjust path
import { formatMultiplier, formatCurrency } from "../../util/formatters"; // Adjust path
import { FaRocket } from "react-icons/fa";

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Tooltip,
    Filler // Register Filler for background colors
);

interface GameDisplayProps {
    graphPoints: GraphPoint[];
    currentValue: number; // Live multiplier during game, final value after end
    gameActive: boolean;
    gameEnded: boolean;
    endOutcome: GameOutcome;
    endValue: number | null; // Actual value where game ended (sell or crash)
    roundProfit: number | null;
    // Props for theoretical path display
    sellTime: number | null; // Time user clicked sell (null if crashed or not ended)
    crashValue: number;      // The crash multiplier value for the round (still needed for overlay)
}

// State type for rocket position
interface RocketPosition {
    x: number;
    y: number;
    angle: number; // degrees
    visible: boolean;
}

const GameDisplay: React.FC<GameDisplayProps> = ({
                                                     graphPoints,
                                                     currentValue, // Live value
                                                     gameActive,
                                                     gameEnded,
                                                     endOutcome,
                                                     endValue, // Actual end value (sell or crash)
                                                     roundProfit,
                                                     sellTime,   // Time user sold
                                                     crashValue, // Actual crash value for the round
                                                 }) => {
    const chartRef = useRef<ChartJS<"line"> | null>(null); // Ref to store chart instance
    const [rocketPosition, setRocketPosition] = useState<RocketPosition>({ x: 0, y: 0, angle: -45, visible: false }); // Initial state

    // --- Effect to Calculate Rocket Position ---
    useEffect(() => {
        const chart = chartRef.current;
        if (!chart || graphPoints.length < 1) {
            setRocketPosition(prev => ({ ...prev, visible: false }));
            return;
        }

        const xScale = chart.scales.x;
        const yScale = chart.scales.y;
        if (!xScale || !yScale) return;

        // Use the actual last point for positioning, even if it's theoretical
        const lastPoint = graphPoints[graphPoints.length - 1];
        if (!lastPoint) {
            setRocketPosition(prev => ({ ...prev, visible: false }));
            return;
        };

        const xPixel = xScale.getPixelForValue(lastPoint.time);
        const yPixel = yScale.getPixelForValue(lastPoint.value);

        let angle = -45; // Default angle

        // Calculate angle based on the last *visible* segment
        const relevantPoints = (gameEnded && endOutcome === 'Sold' && sellTime !== null)
            ? graphPoints.filter(p => p.time <= sellTime)
            : graphPoints;

        if (relevantPoints.length >= 2) {
            const finalVisiblePoint = relevantPoints[relevantPoints.length - 1];
            const secondFinalVisiblePoint = relevantPoints[relevantPoints.length - 2];

            const xPixelPrev = xScale.getPixelForValue(secondFinalVisiblePoint.time);
            const yPixelPrev = yScale.getPixelForValue(secondFinalVisiblePoint.value);
            const xPixelFinal = xScale.getPixelForValue(finalVisiblePoint.time);
            const yPixelFinal = yScale.getPixelForValue(finalVisiblePoint.value);

            const dx = xPixelFinal - xPixelPrev;
            const dy = yPixelFinal - yPixelPrev;

            if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1) {
                angle = Math.atan2(dy, dx) * (180 / Math.PI);
            }
        }

        if (isNaN(xPixel) || isNaN(yPixel) || isNaN(angle)) {
            console.warn("Calculated invalid rocket position/angle", { xPixel, yPixel, angle });
            setRocketPosition(prev => ({ ...prev, visible: false }));
            return;
        }

        // Update rocket position state
        setRocketPosition({
            x: xPixel,
            y: yPixel,
            angle: angle,
            visible: gameActive || (gameEnded && graphPoints.length > 1)
        });

    }, [graphPoints, gameActive, gameEnded, endOutcome, sellTime]); // Re-run when relevant data changes


    // --- Chart Data Logic ---
    const getChartData = (): ChartData<"line", number[], number> => {
        const labels = graphPoints.map(p => p.time);
        const datasets = [];

        // Define colors
        const colorSold = "rgb(34, 197, 94)"; // Green-600
        const colorCrashed = "rgb(239, 68, 68)"; // Red-500
        const colorActive = "rgb(167, 139, 250)"; // Purple-400
        const colorTheoretical = "rgba(107, 114, 128, 0.6)"; // Gray-500 semi-transparent

        const backgroundSold = "rgba(34, 197, 94, 0.2)";
        const backgroundCrashed = "rgba(239, 68, 68, 0.2)";
        const backgroundActive = "rgba(167, 139, 250, 0.1)";
        const backgroundTheoretical = "rgba(107, 114, 128, 0.05)"; // Very light gray fill

        if (gameEnded && endOutcome === "Sold" && sellTime !== null) {
            // --- SOLD STATE: Show actual + theoretical ---
            const actualData = graphPoints.map(p => (p.time <= sellTime ? p.value : NaN));
            const theoreticalData = graphPoints.map(p => (p.time >= sellTime ? p.value : NaN));

            datasets.push({
                label: "Actual Path", data: actualData, borderColor: colorSold,
                backgroundColor: backgroundSold, tension: 0.2, pointRadius: 0,
                borderWidth: 3, fill: true, order: 1
            });
            datasets.push({
                label: "Theoretical Path", data: theoreticalData, borderColor: colorTheoretical,
                backgroundColor: backgroundTheoretical, borderDash: [5, 5], tension: 0.2,
                pointRadius: 0, borderWidth: 2, fill: true, order: 2
            });
        } else {
            // --- ACTIVE or CRASHED STATE: Show single path ---
            const color = gameEnded ? colorCrashed : colorActive;
            const bgColor = gameEnded ? backgroundCrashed : backgroundActive;
            datasets.push({
                label: "Multiplier", data: graphPoints.map(p => p.value),
                borderColor: color, backgroundColor: bgColor, tension: 0.2,
                pointRadius: 0, borderWidth: 3, fill: true, order: 1
            });
        }
        return { labels, datasets };
    };

    const chartData = getChartData(); // Generate the data based on state

    // --- Chart Options ---
    const chartOptions: ChartOptions<"line"> = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            x: {
                type: "linear", position: "bottom", title: { display: false }, min: 0,
                suggestedMax: Math.max(graphPoints[graphPoints.length - 1]?.time ?? 1, 1.5) * 1.05,
                ticks: { color: "#6b7280", maxTicksLimit: 6, callback: (v) => typeof v === 'number' ? `${v.toFixed(1)}s` : v, font: { size: 10 } },
                grid: { color: "rgba(55, 65, 81, 0.5)", drawTicks: false, },
                border: { display: false }
            },
            y: {
                type: 'linear', position: 'right', title: { display: false }, min: 1.0,
                // *** Y-Axis Max Calculation Logic ***
                suggestedMax: (() => {
                    // Find highest value currently present in the graph data
                    const currentMaxPointValue = Math.max(...graphPoints.map(p => p.value), 1.0);

                    if (gameActive && !gameEnded) {
                        // --- Active Game ---
                        // Base max on the higher of current live value or highest point seen, plus padding.
                        // Ensure a minimum scale (e.g., 1.5x) so graph isn't too flat initially.
                        // Does NOT use crashValue here.
                        return Math.max(currentValue * 1.15, currentMaxPointValue * 1.15, 1.5);
                    } else {
                        // --- Game Ended or Not Started ---
                        // Base max on the highest point in the *entire* dataset (including theoretical/crash point)
                        // plus a small padding. Use crashValue as a fallback max if needed.
                        return Math.max(currentMaxPointValue, crashValue ?? 1.1, 1.5) * 1.05;
                    }
                })(), // Immediately invoke the function
                // *** End Y-Axis Max Calculation Logic ***
                ticks: { color: "#6b7280", maxTicksLimit: 6, callback: (v) => typeof v === 'number' ? `${v.toFixed(1)}x` : v, padding: 10, font: { size: 10 } },
                grid: { color: "rgba(55, 65, 81, 0.5)", drawTicks: false, },
                border: { display: false }
            },
        },
        plugins: {
            legend: { display: false },
            tooltip: {
                enabled: !gameActive,
                mode: 'index',
                intersect: false,
            },
            filler: { propagate: true }
        },
        animation: { duration: 0 },
        elements: { line: { borderCapStyle: 'round' } },
        layout: { padding: { top: 15, right: 5, bottom: 5, left: 15 } }
    };

    // --- Render ---
    return (
        <div className="relative h-64 md:h-80 bg-[#1a1f3a] rounded-lg border border-gray-700 overflow-hidden p-1">

            {/* Chart Container */}
            <div className="absolute inset-1">
                {graphPoints.length > 0 ? (
                    <Line ref={chartRef} data={chartData} options={chartOptions} />
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">Loading Chart...</div>
                )}
            </div>

            {/* Rocket Icon */}
            {rocketPosition.visible && (
                <FaRocket
                    className={`absolute text-purple-400 text-xl md:text-2xl transition-transform duration-100 ease-linear ${
                        gameActive && !gameEnded ? 'animate-pulse' : ''
                    } ${
                        gameEnded && endOutcome === 'Crashed' ? '!text-red-500' : '' // Red on crash
                    } ${
                        gameEnded && endOutcome === 'Sold' ? '!text-green-500' : '' // Green on successful sell
                    }`}
                    style={{
                        left: `${rocketPosition.x}px`,
                        top: `${rocketPosition.y}px`,
                        transform: `translate(-50%, -50%) rotate(${rocketPosition.angle}deg)`,
                        willChange: 'transform, left, top' // Performance hint
                    }}
                />
            )}


            {/* Live/Final Multiplier Display (Top Center) */}
            <div className="absolute top-2 left-1/2 transform -translate-x-1/2 z-10">
                <div
                    className={`bg-gray-900/70 backdrop-blur-sm px-4 py-1 rounded-full font-bold text-xl md:text-2xl shadow-lg transition-colors duration-200 ${
                        gameActive && !gameEnded ? "text-purple-300 animate-pulse" : "text-white" // Active state
                    } ${
                        gameEnded ? (endOutcome === 'Crashed' ? 'text-red-400' : 'text-green-400') : '' // Ended state color
                    }`}
                >
                    {/* Show actual endValue when game ended, otherwise live currentValue */}
                    {formatMultiplier(gameEnded ? endValue : currentValue)}
                </div>
            </div>

            {/* Game Result Overlay */}
            {gameEnded && endOutcome && endValue !== null && (
                <div className="absolute inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-20 pointer-events-none"> {/* Disable pointer events */}
                    <div
                        className={`text-center p-4 md:p-6 rounded-lg shadow-xl border ${
                            endOutcome === "Sold"
                                ? "bg-green-800/80 border-green-600"
                                : "bg-red-800/80 border-red-600"
                        }`}
                    >
                        <p className="font-bold text-xl md:text-2xl text-white mb-1">
                            {endOutcome === "Sold" ? "Sold!" : "Crashed!"}
                        </p>
                        {/* Display crash value if user sold */}
                        {endOutcome === "Sold" && (
                            <p className="text-xs text-gray-300 mt-1">
                                (Would've crashed @ {formatMultiplier(crashValue)}) {/* Show hidden crash value here */}
                            </p>
                        )}
                        {roundProfit !== null && (
                            <p
                                className={`text-lg md:text-xl mt-1 font-semibold ${
                                    roundProfit >= 0 ? "text-green-300" : "text-red-300"
                                }`}
                            >
                                {formatCurrency(roundProfit, true)} {/* Show profit/loss */}
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default GameDisplay;