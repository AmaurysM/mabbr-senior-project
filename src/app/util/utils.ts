import { MIN_CRASH_MULTIPLIER } from "../games/stocket/constants"; 

export const generateCrashPoint = (): number => {
    // Generate using exponential distribution for realistic crash points
    // This creates more common lower values (1.1x-3x) and rare higher values (10x+)
    const rand = Math.random();
    // Adjust the formula slightly to ensure it's strictly >= MIN_CRASH_MULTIPLIER
    const baseValue = (1 / (1 - Math.pow(rand, 0.9))) - 0.5;
    return Math.max(MIN_CRASH_MULTIPLIER, parseFloat(baseValue.toFixed(2)));
};