import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import {headers} from "next/headers";

export async function GET() {
    try {
        const session = await auth.api.getSession({headers: await headers() });
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({ favorites: user.favoriteStocks || [] }, { status: 200 });
    } catch (error) {
        console.error('Error fetching favorites:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { symbol, action } = body;

        if (!symbol || !action || (action !== 'add' && action !== 'remove')) {
            return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
        }

        // Authenticate the user using your custom auth function
        const session = await auth.api.getSession({headers: await headers() });
        if (!session || !session.user || !session.user.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const userEmail = session.user.email;

        // Get the current user record
        const user = await prisma.user.findUnique({ where: { email: userEmail } });
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const currentFavorites: string[] = user.favoriteStocks || [];
        let updatedFavorites: string[];
        if (action === 'add') {
            updatedFavorites = currentFavorites.includes(symbol)
                ? currentFavorites
                : [...currentFavorites, symbol];
        } else {
            updatedFavorites = currentFavorites.filter(fav => fav !== symbol);
        }

        // Update the user's favorite stocks
        const updatedUser = await prisma.user.update({
            where: { email: userEmail },
            data: { favoriteStocks: updatedFavorites },
        });

        return NextResponse.json({ favorites: updatedUser.favoriteStocks }, { status: 200 });
    } catch (error) {
        console.error('Error updating favorites:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
