import { NextRequest, NextResponse } from 'next/server';

// Adds debugging headers to responses to help diagnose issues in production
export function withDebugHeaders(handler: (req: NextRequest) => Promise<NextResponse>) {
  return async (request: NextRequest) => {
    try {
      // Call the original handler
      const response = await handler(request);
      
      // Add debugging headers
      response.headers.set('X-Debug-Requested-URL', request.url);
      response.headers.set('X-Debug-Time', new Date().toISOString());
      
      // Return the modified response
      return response;
    } catch (error) {
      // Log the error
      console.error('API Error:', error);
      
      // Create a detailed error response
      const errorResponse = NextResponse.json(
        {
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : null) : undefined,
          time: new Date().toISOString()
        },
        { status: 500 }
      );
      
      // Add debugging headers to error response
      errorResponse.headers.set('X-Debug-Error', 'true');
      errorResponse.headers.set('X-Debug-Requested-URL', request.url);
      errorResponse.headers.set('X-Debug-Time', new Date().toISOString());
      
      return errorResponse;
    }
  };
}

// Helper function to check if a database model exists
export function checkModelExists(prisma: any, modelName: string): boolean {
  try {
    // Check if the model exists on the prisma client
    return !!prisma[modelName];
  } catch (error) {
    console.error(`Error checking if model ${modelName} exists:`, error);
    return false;
  }
}

// Helper to create a safe database transaction that won't crash your app
export async function safeTransaction<T>(
  prisma: any, 
  callback: (tx: any) => Promise<T>,
  fallback: T
): Promise<T> {
  try {
    return await prisma.$transaction(callback);
  } catch (error) {
    console.error('Transaction error:', error);
    return fallback;
  }
} 