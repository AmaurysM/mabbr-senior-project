import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { withDebugHeaders, safeTransaction } from '../debug-handler';

// GET user data
export const GET = withDebugHeaders(async (request: NextRequest) => {
    try {
        console.log('[USER GET] Request received');
        
        // Await the dynamic route parameters
        // const params = await context.params;

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        console.log('[USER GET] Requested user ID:', id || 'current user');

        // Get the session using the auth object
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session?.user) {
            console.log('[USER GET] No authenticated user session');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // If no ID is provided, return the current user's information
        const userId = id || session.user.id;
        console.log('[USER GET] Fetching data for user ID:', userId);

        // Fetch user data with safe transaction
        const user = await safeTransaction(
            prisma,
            async (tx) => {
                return await tx.user.findUnique({
                    where: { id: userId },
                    // Only select fields we need and that exist in the schema
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        image: true,
                        banner: true,
                        role: true,
                        premium: true,
                        balance: true,
                        tokenCount: true,
                        createdAt: true,
                        bio: true,
                    },
                });
            },
            null // Fallback value
        );

        if (!user) {
            console.log('[USER GET] User not found, ID:', userId);
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        console.log('[USER GET] User data fetched successfully');
        return NextResponse.json(user);
    } catch (error) {
        console.error('[USER GET] Error fetching user data:', error);
        return NextResponse.json(
            { 
                error: 'Failed to fetch user data', 
                details: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        );
    }
});

// Update user data
export const PATCH = withDebugHeaders(async (request: NextRequest) => {
    try {
        console.log('[USER PATCH] Request received');
        
        // Await the dynamic route parameters
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id') || '';
        console.log('[USER PATCH] Target user ID:', id);

        // Get the session using the auth object
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session?.user) {
            console.log('[USER PATCH] No authenticated user session');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify user is updating their own profile
        if (session.user.id !== id) {
            console.log('[USER PATCH] User attempted to update another account:', session.user.id, 'vs', id);
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Get update data from request
        const updateData = await request.json();
        console.log('[USER PATCH] Update fields requested:', Object.keys(updateData).join(', '));

        // Validate update data
        const allowedFields = ['name', 'email', 'bio'];
        const filteredData: Record<string, string> = {};

        for (const field of allowedFields) {
            if (updateData[field] !== undefined) {
                filteredData[field] = updateData[field];
            }
        }

        if (Object.keys(filteredData).length === 0) {
            console.log('[USER PATCH] No valid fields to update');
            return NextResponse.json(
                { error: 'No valid fields to update' },
                { status: 400 }
            );
        }

        // Update user in database with safe transaction
        const updatedUser = await safeTransaction(
            prisma,
            async (tx) => {
                return await tx.user.update({
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
            },
            null // Fallback value
        );
        
        if (!updatedUser) {
            console.log('[USER PATCH] Failed to update user');
            return NextResponse.json(
                { error: 'Failed to update user data' },
                { status: 500 }
            );
        }

        console.log('[USER PATCH] User updated successfully');
        return NextResponse.json(updatedUser);
    } catch (error) {
        console.error('[USER PATCH] Error updating user data:', error);
        return NextResponse.json(
            { 
                error: 'Failed to update user data',
                details: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        );
    }
});
