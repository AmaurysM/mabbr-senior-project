import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    // Get total users to calculate token distribution
    const totalUsers = await prisma.user.count();
    
    // Get sum of all user token counts
    const tokenSum = await prisma.user.aggregate({
      _sum: {
        tokenCount: true
      }
    });
    
    const totalTokens = tokenSum._sum.tokenCount || 0;
    
    // Calculate token value based on total tokens in circulation
    // With very few tokens in circulation, value is extremely high
    // As circulation increases, value drops exponentially
    
    // If only 1 token exists, it's worth $500,000
    // We'll use an exponential decay function: value = maxValue * e^(-circulationFactor * totalTokens)
    const maxValue = 500000; // Max value is $500,000 per token
    const minValue = 0.01; // Min value is $0.01 per token
    
    // The circulation factor controls how quickly the value drops
    // Higher value = faster drop
    const circulationFactor = 0.0001; // Adjust this to control the rate of value decrease
    
    // Calculate token value with exponential decay
    let tokenValue = maxValue * Math.exp(-circulationFactor * totalTokens);
    
    // Ensure value doesn't go below minimum
    tokenValue = Math.max(minValue, tokenValue);
    
    // Calculate interest rate based on token value (inverse relationship)
    // Higher token value = lower interest to balance economy
    const maxInterest = 0.08; // 8% max daily interest
    const minInterest = 0.01; // 1% min daily interest
    
    // Normalize token value to calculate interest
    // Since token value can range widely, we'll use a logarithmic scale
    const logMaxValue = Math.log(maxValue);
    const logMinValue = Math.log(minValue);
    const logTokenValue = Math.log(tokenValue);
    
    // Calculate normalized value (0 = lowest token value, 1 = highest token value)
    const normalizedValue = (logTokenValue - logMinValue) / (logMaxValue - logMinValue);
    
    // Interest rate is inversely related to token value
    // High token value = low interest, Low token value = high interest
    const interestRate = minInterest + (maxInterest - minInterest) * (1 - normalizedValue);
    
    // Mock market data
    return NextResponse.json({
      tokenValue,
      interestRate,
      tokenSupply: totalTokens,
      dailyVolume: Math.floor(totalTokens * 0.05), // Assume 5% daily volume
      marketCap: totalTokens * tokenValue,
    });
  } catch (error) {
    console.error('Error fetching token market data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch token market data' },
      { status: 500 }
    );
  }
} 