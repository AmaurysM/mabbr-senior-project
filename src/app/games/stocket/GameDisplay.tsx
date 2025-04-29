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
    Filler,
    Chart,
} from "chart.js";
import { GraphPoint, GameOutcome } from "./types";
import { formatMultiplier, formatCurrency } from "../../util/formatters";
import { FaRocket } from "react-icons/fa";

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Tooltip,
    Filler
);

interface GameDisplayProps {
    graphPoints: GraphPoint[];
    currentValue: number;
    gameActive: boolean;
    gameEnded: boolean;
    endOutcome: GameOutcome;
    endValue: number | null;
    roundProfit: number | null;
    sellTime: number | null;
    crashValue: number;
}

interface RocketPosition {
    x: number;
    y: number;
    angle: number;
    visible: boolean;
}

const GameDisplay: React.FC<GameDisplayProps> = ({
                                                     graphPoints,
                                                     currentValue,
                                                     gameActive,
                                                     gameEnded,
                                                     endOutcome,
                                                     endValue,
                                                     roundProfit,
                                                     sellTime,
                                                     crashValue,
                                                 }) => {
    const chartRef = useRef<ChartJS<"line"> | null>(null);
    const [rocketPosition, setRocketPosition] = useState<RocketPosition>({ x: 0, y: 0, angle: -45, visible: false });

    useEffect(() => {
        const chart = chartRef.current;
        if (!chart || graphPoints.length < 1) {
            setRocketPosition(prev => ({ ...prev, visible: false }));
            return;
        }

        const xScale = chart.scales.x;
        const yScale = chart.scales.y;
        if (!xScale || !yScale) return;

        const lastPoint = graphPoints[graphPoints.length - 1];
        if (!lastPoint) {
            setRocketPosition(prev => ({ ...prev, visible: false }));
            return;
        };

        const xPixel = xScale.getPixelForValue(lastPoint.time);
        const yPixel = yScale.getPixelForValue(lastPoint.value);

        let angle = -45;

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

        setRocketPosition({
            x: xPixel,
            y: yPixel,
            angle: angle,
            visible: gameActive || (gameEnded && graphPoints.length > 1)
        });

    }, [graphPoints, gameActive, gameEnded, endOutcome, sellTime]);


    const getChartData = (): ChartData<"line", number[], number> => {
        const labels = graphPoints.map(p => p.time);
        const datasets = [];

        const colorSold = "rgb(34, 197, 94)";
        const colorCrashed = "rgb(239, 68, 68)";
        const colorActive = "rgb(167, 139, 250)";
        const colorTheoretical = "rgba(107, 114, 128, 0.6)";

        const backgroundSold = "rgba(34, 197, 94, 0.2)";
        const backgroundCrashed = "rgba(239, 68, 68, 0.2)";
        const backgroundActive = "rgba(167, 139, 250, 0.1)";
        const backgroundTheoretical = "rgba(107, 114, 128, 0.05)";

        if (gameEnded && endOutcome === "Sold" && sellTime !== null) {
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

    const chartData = getChartData();

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
                suggestedMax: (() => {
                    const currentMaxPointValue = Math.max(...graphPoints.map(p => p.value), 1.0);

                    if (gameActive && !gameEnded) {
                        return Math.max(currentValue * 1.15, currentMaxPointValue * 1.15, 1.5);
                    } else {
                        return Math.max(currentMaxPointValue, crashValue ?? 1.1, 1.5) * 1.05;
                    }
                })(),
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
                        gameEnded && endOutcome === 'Crashed' ? '!text-red-500' : ''
                    } ${
                        gameEnded && endOutcome === 'Sold' ? '!text-green-500' : ''
                    }`}
                    style={{
                        left: `${rocketPosition.x}px`,
                        top: `${rocketPosition.y}px`,
                        transform: `translate(-50%, -50%) rotate(${rocketPosition.angle}deg)`,
                        willChange: 'transform, left, top'
                    }}
                />
            )}


            {/* Live/Final Multiplier Display (Top Center) */}
            <div className="absolute top-2 left-1/2 transform -translate-x-1/2 z-10">
                <div
                    className={`bg-gray-900/70 backdrop-blur-sm px-4 py-1 rounded-full font-bold text-xl md:text-2xl shadow-lg transition-colors duration-200 ${
                        gameActive && !gameEnded ? "text-purple-300 animate-pulse" : "text-white"
                    } ${
                        gameEnded ? (endOutcome === 'Crashed' ? 'text-red-400' : 'text-green-400') : ''
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