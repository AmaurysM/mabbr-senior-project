export const formatMultiplier = (value: number | null | undefined): string =>
    `${(value ?? 1.0).toFixed(2)}x`;
  
  export const formatCurrency = (value: number | null | undefined, showSign = false): string => {
      const num = value ?? 0;
      const sign = showSign && num > 0 ? "+" : "";
      return `${sign}$${num.toFixed(2)}`;
  }
  