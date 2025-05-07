import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatNumber = (num: number | undefined) => {
  if (!num) return 'N/A';
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 2,
  }).format(num);
};

export const abbreviateNumber = (value: number) => {
  const abs = Math.abs(value);
  const units = [
    { limit: 1e24, suffix: "Y" },   
    { limit: 1e21, suffix: "Z" },   
    { limit: 1e18, suffix: "E" },   
    { limit: 1e15, suffix: "P" },   
    { limit: 1e12, suffix: "T" },   
    { limit: 1e9,  suffix: "B" },   
    { limit: 1e6,  suffix: "M" },   
    { limit: 1e3,  suffix: "K" },   
  ];

  for (const { limit, suffix } of units) {
    if (abs >= limit) {
      return (value / limit).toFixed(2) + suffix;
    }
  }

  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};



