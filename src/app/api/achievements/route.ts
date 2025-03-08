import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Achievements } from '@/lib/prisma_types';

export async function GET() {
  try {

    const request:Achievements = await prisma.achievement.findMany({});
    
    if (!request) {
      return NextResponse.json({ error: 'Friend request not found' }, { status: 404 });
    }
    console.log("User Achievements [/api/achievements/route.ts]:", request);

    return NextResponse.json( request ?? []);
    
  } catch (error) {
    console.error('Error accepting friend request:', error);
    return NextResponse.json({
      error: 'Failed to accept friend request'
    }, { status: 500 });
  }
} 