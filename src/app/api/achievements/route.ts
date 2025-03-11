import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const achievements = await prisma.achievement.findMany({
      include: {
        users: true, // Include users who earned the achievement
      },
    });
    return NextResponse.json(achievements);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch achievements' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(request: Request) {
  const { userId, achievementId } = await request.json();

  try {
    const existingUserAchievement = await prisma.userAchievement.findUnique({
      where: {
        userId_achievementId: {
          userId,
          achievementId,
        },
      },
    });

    if (existingUserAchievement) {
      return NextResponse.json(
        { message: 'User already has this achievement' },
        { status: 400 }
      );
    }

    const userAchievement = await prisma.userAchievement.create({
      data: {
        userId,
        achievementId,
      },
    });
    return NextResponse.json(userAchievement);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to add user to achievement' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
