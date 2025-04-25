import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function GET() {
  try {
    // Get the session using the auth object
    const session = await auth.api.getSession({ headers: await headers() });
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Fetch users with their token data (using tokenCount field from schema)
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        tokenCount: true, // Correct field from Prisma schema
      },
      orderBy: {
        tokenCount: 'desc', // Order by tokenCount
      },
      take: 10, // Get top 10 users
    });
    
    // Map the data to match the expected structure
    const mappedUsers = users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      tokens: user.tokenCount || 0, // Map tokenCount to tokens for the frontend
    }));
    
    return NextResponse.json({ users: mappedUsers });
  } catch (error) {
    console.error('Error fetching token leaderboard:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch token leaderboard',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 