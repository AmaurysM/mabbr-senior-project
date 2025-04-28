import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { safeApiHandler, handleCors, emptyOkResponse } from '../api-utils';

// GET /api/user
// Get the currently logged in user's data
export async function GET(request: NextRequest) {
    // Handle CORS preflight requests
    const corsResponse = handleCors(request);
    if (corsResponse) return corsResponse;
    
    return safeApiHandler(request, async (req) => {
        console.log('[USER GET] Request received');
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user) {
            console.log('[USER GET] No valid session found');
            return NextResponse.json(
                { error: "You must be logged in to access this endpoint" },
                { status: 401 }
            );
        }

        console.log('[USER GET] User ID:', session.user.id);

        try {
            const user = await prisma.user.findUnique({
                where: {
                    id: session.user.id,
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    image: true,
                    tokenCount: true,
                    claimedLoginBonus: true,
                    verified: true
                },
            });

            if (!user) {
                console.log('[USER GET] User not found in database');
                return NextResponse.json(
                    { error: "User not found" },
                    { status: 404 }
                );
            }

            console.log('[USER GET] Successfully retrieved user data');
            return NextResponse.json(user);
        } catch (error) {
            console.error('[USER GET] Error fetching user data:', error);
            return NextResponse.json(
                { 
                    error: "Failed to retrieve user data",
                    details: error instanceof Error ? error.message : String(error)
                },
                { status: 500 }
            );
        }
    });
}

// PATCH /api/user
// Update the currently logged in user
export async function PATCH(request: NextRequest) {
    // Handle CORS preflight requests
    const corsResponse = handleCors(request);
    if (corsResponse) return corsResponse;
    
    return safeApiHandler(request, async (req) => {
        console.log('[USER PATCH] Request received');
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user) {
            console.log('[USER PATCH] No valid session found');
            return NextResponse.json(
                { error: "You must be logged in to access this endpoint" },
                { status: 401 }
            );
        }

        console.log('[USER PATCH] User ID:', session.user.id);

        let requestData;
        try {
            requestData = await request.json();
        } catch (parseError) {
            console.error('[USER PATCH] Error parsing request JSON:', parseError);
            return NextResponse.json(
                { error: "Invalid JSON in request body" },
                { status: 400 }
            );
        }

        const { tokenCount, claimedLoginBonus, verified } = requestData;
        let updateData: any = {};

        console.log('[USER PATCH] Update data received:', requestData);

        // Only include fields that were provided
        if (tokenCount !== undefined) updateData.tokenCount = tokenCount;
        if (claimedLoginBonus !== undefined) updateData.claimedLoginBonus = claimedLoginBonus;
        if (verified !== undefined) updateData.verified = verified;

        if (Object.keys(updateData).length === 0) {
            console.log('[USER PATCH] No fields to update');
            return NextResponse.json(
                { error: "No fields to update were provided" },
                { status: 400 }
            );
        }

        try {
            console.log('[USER PATCH] Updating user with:', updateData);
            const updatedUser = await prisma.user.update({
                where: {
                    id: session.user.id,
                },
                data: updateData,
                select: {
                    id: true,
                    name: true,
                    email: true,
                    image: true,
                    tokenCount: true,
                    claimedLoginBonus: true,
                    verified: true
                },
            });

            console.log('[USER PATCH] User updated successfully');
            return NextResponse.json(updatedUser);
        } catch (error) {
            console.error('[USER PATCH] Error updating user:', error);
            return NextResponse.json(
                { 
                    error: "Failed to update user",
                    details: error instanceof Error ? error.message : String(error)
                },
                { status: 500 }
            );
        }
    });
}

// OPTIONS handler for CORS
export async function OPTIONS() {
    // Using the standardized CORS handler
    return handleCors();
}
