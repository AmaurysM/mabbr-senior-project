import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Function to get the actual total tokens in circulation
async function getTotalTokensInCirculation(): Promise<number> {
  try {
    // Get the actual current token count from all users
    const totalTokens = await prisma.user.aggregate({
      _sum: {
        tokenCount: true,
      },
    });
    
    return totalTokens._sum.tokenCount || 0;
  } catch (error) {
    console.error('Error getting total tokens in circulation:', error);
    return 0;
  }
}

// Function to calculate token value based on circulation
function calculateTokenValue(tokensInCirculation: number): number {
  // If only 1 token exists, it's worth $250,000 (changed from $500,000)
  // We'll use an exponential decay function: value = maxValue * e^(-circulationFactor * totalTokens)
  const maxValue = 250000; // Max value is $250,000 per token (reduced from $500,000)
  const minValue = 0.01; // Min value is $0.01 per token
  
  // The circulation factor controls how quickly the value drops
  // Higher value = faster drop
  const circulationFactor = 0.0001; // Adjust this to control the rate of value decrease
  
  // Calculate token value with exponential decay
  let tokenValue = maxValue * Math.exp(-circulationFactor * tokensInCirculation);
  
  // Ensure value doesn't go below minimum
  return Math.max(minValue, Math.min(maxValue, tokenValue));
}

export async function GET() {
  try {
    // Get total users to calculate token distribution
    const totalUsers = await prisma.user.count();
    
    // Get total tokens in circulation using the shared function
    const totalTokens = await getTotalTokensInCirculation();
    
    // Calculate token value based on total tokens in circulation
    const tokenValue = calculateTokenValue(totalTokens);
    
    // Set a fixed 3% interest rate instead of dynamic calculation
    const interestRate = 0.03; // 3% fixed daily interest
    
    // Ensure we're returning accurate data
    const marketCap = totalTokens * tokenValue;
    
    // Get daily volume - calculate based on transaction history from the last 24 hours
    let dailyVolume = 0;
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      // Get token exchange transactions from the last 24 hours
      const recentTransactions = await prisma.tokenMarketDataPoint.findMany({
        where: {
          timestamp: {
            gte: yesterday
          }
        },
        orderBy: {
          timestamp: 'desc'
        }
      });
      
      if (recentTransactions.length > 0) {
        // If we have transaction data, use the average daily volume
        dailyVolume = Math.floor(totalTokens * 0.05); // Default to 5% if no better data
        
        if (recentTransactions.length >= 2) {
          // Calculate actual change in circulation between points
          const changes = [];
          for (let i = 1; i < recentTransactions.length; i++) {
            const change = Math.abs(
              recentTransactions[i].tokensInCirculation - 
              recentTransactions[i-1].tokensInCirculation
            );
            changes.push(change);
          }
          
          // Use the average change if we have data
          if (changes.length > 0) {
            const averageChange = changes.reduce((sum, val) => sum + val, 0) / changes.length;
            dailyVolume = Math.floor(averageChange);
          }
        }
      } else {
        // Default to 5% of total supply as daily volume if no transaction data
        dailyVolume = Math.floor(totalTokens * 0.05);
      }
    } catch (error) {
      console.error('Error calculating daily volume:', error);
      // Default to 5% of total supply as daily volume
      dailyVolume = Math.floor(totalTokens * 0.05);
    }
    
    return NextResponse.json({
      tokenValue,
      interestRate,
      tokenSupply: totalTokens,
      dailyVolume: dailyVolume,
      marketCap: marketCap,
    });
  } catch (error) {
    console.error('Error fetching token market data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch token market data' },
      { status: 500 }
    );
  }
} 