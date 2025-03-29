import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

// GET user data
export async function GET(
    request: NextRequest,
) {
    try {
        // Await the dynamic route parameters
        // const params = await context.params;

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id') || '';

        // Get the session using the auth object
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch user data
        const user = await prisma.user.findUnique({
            where: { id },
            // Only select fields we need and that exist in the schema
            select: {
                id: true,
                name: true,
                email: true,
                image: true,
                role: true,
                premium: true,
                balance: true,
                createdAt: true,
                bio: true,
            },
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json(user);
    } catch (error) {
        console.error('Error fetching user data:', error);
        return NextResponse.json(
            { error: 'Failed to fetch user data' },
            { status: 500 }
        );
    }
}

// Update user data
export async function PATCH(
    request: NextRequest,
) {
    try {
        // Await the dynamic route parameters
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id') || '';

        // Get the session using the auth object
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify user is updating their own profile
        if (session.user.id !== id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Get update data from request
        const updateData = await request.json();

        // Validate update data
        const allowedFields = ['name', 'email', 'bio'];
        const filteredData: Record<string, string> = {};

        for (const field of allowedFields) {
            if (updateData[field] !== undefined) {
                filteredData[field] = updateData[field];
            }
        }

        if (Object.keys(filteredData).length === 0) {
            return NextResponse.json(
                { error: 'No valid fields to update' },
                { status: 400 }
            );
        }

        // Update user in database
        const updatedUser = await prisma.user.update({
            where: { id },
            data: {
                ...filteredData,
                updatedAt: new Date(), // Explicitly set updatedAt to current time
            },
            select: {
                id: true,
                name: true,
                email: true,
                bio: true,
                updatedAt: true,
            },
        });

        return NextResponse.json(updatedUser);
    } catch (error) {
        console.error('Error updating user data:', error);
        return NextResponse.json(
            { error: 'Failed to update user data' },
            { status: 500 }
        );
    }
}
