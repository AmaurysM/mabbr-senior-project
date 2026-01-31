import { PrismaClient } from '@prisma/client';

// Environment variables from Next.js config
const isDev = process.env.NODE_ENV === 'development';
const isEdge = typeof process.env.NEXT_RUNTIME === 'string' && process.env.NEXT_RUNTIME === 'edge';
const isVercel = process.env.VERCEL === '1';

// Function to create a new PrismaClient instance with retry logic
const prismaClientSingleton = () => {
  console.log(`Creating new PrismaClient instance (env: ${process.env.NODE_ENV}, edge: ${isEdge}, vercel: ${isVercel})`);
  
  // Create a new PrismaClient with better logging in development
  const baseClient = new PrismaClient({
    log: isDev
      ? ['error', 'warn'] 
      : ['error'],
    // Add connection timeout for production environments
    ...(isVercel ? {
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      }
    } : {})
  });
  
  // Use Prisma Client Extensions for middleware-like functionality
  const client = baseClient.$extends({
    query: {
      $allModels: {
        async $allOperations({ operation, model, args, query }) {
          const before = Date.now();
          let result;
          
          try {
            // Add retry logic for transient failures
            let retries = 0;
            const maxRetries = 3;
            
            while (true) {
              try {
                result = await query(args);
                break; // Success, exit the retry loop
              } catch (error: any) {
                // Only retry on connection errors or transient failures
                const isConnectionError = error.message && (
                  error.message.includes('connection') ||
                  error.message.includes('timeout') ||
                  error.message.includes('ECONNRESET') ||
                  error.message.includes('ETIMEDOUT') ||
                  error.code === 'P1001' || // Connection error
                  error.code === 'P1008' || // Operation timeout
                  error.code === 'P1017'    // Server closed the connection
                );
                
                retries++;
                if (isConnectionError && retries < maxRetries) {
                  // Exponential backoff
                  const delay = Math.pow(2, retries) * 100;
                  console.warn(`Database operation retry ${retries}/${maxRetries} after ${delay}ms delay`);
                  await new Promise(r => setTimeout(r, delay));
                  continue;
                }
                
                // No more retries or not a connection error
                throw error;
              }
            }
            
            const after = Date.now();
            const duration = after - before;
            
            // Log slow queries
            if (duration > 100) {
              console.log(`Slow query (${duration}ms): ${model}.${operation}`);
            }
            
            return result;
          } catch (error) {
            console.error(`Error in ${model}.${operation}:`, error);
            throw error;
          }
        }
      }
    }
  });
  
  // Connect to the database
  baseClient.$connect()
    .then(() => console.log('PrismaClient connected successfully'))
    .catch(e => {
      console.error('PrismaClient connection error:', e);
      // For Edge runtime, we need special handling
      if (isEdge) {
        console.log('Edge runtime detected, skipping reconnection attempts');
      }
    });
  
  return client;
};

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

// Get or create the Prisma instance
let prisma: ReturnType<typeof prismaClientSingleton>;

// Handle edge runtime which doesn't support globals
if (isEdge) {
  console.log('Creating new Prisma instance for Edge runtime');
  prisma = prismaClientSingleton();
} else {
  // For regular Node.js environments, use the global instance
  prisma = globalThis.prismaGlobal ?? prismaClientSingleton();
  
  // Ensure the prisma instance is reused across hot reloads in development
  if (isDev) globalThis.prismaGlobal = prisma;
}

export default prisma;

// Add a reconnect method with multiple retries
export const reconnectPrisma = async () => {
  try {
    console.log('Attempting to reconnect to database...');
    
    // Maximum reconnection attempts
    const maxRetries = 3;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        // Disconnect first if we have an active connection
        await prisma.$disconnect();
        console.log('Prisma disconnected for reconnection');
        
        // Wait a moment before reconnecting
        await new Promise(r => setTimeout(r, 500));
        
        // Create a new instance
        if (isEdge) {
          // For Edge runtime, we create a new instance directly
          prisma = prismaClientSingleton();
        } else {
          // For Node.js, update the global instance
          globalThis.prismaGlobal = prismaClientSingleton();
          prisma = globalThis.prismaGlobal;
        }
        
        // Attempt a simple query to verify connection
        await prisma.user.count({
          take: 1, // Just check if we can connect, limit to 1 result
          where: {} // Empty where clause to count all users
        });
        console.log('Database reconnected and verified successfully');
        return true;
      } catch (retryError) {
        console.error(`Reconnection attempt ${i+1}/${maxRetries} failed:`, retryError);
        
        if (i === maxRetries - 1) {
          // This was the last attempt
          throw retryError;
        }
        
        // Wait with exponential backoff before next attempt
        const delay = Math.pow(2, i+1) * 500;
        console.log(`Waiting ${delay}ms before next reconnection attempt...`);
        await new Promise(r => setTimeout(r, delay));
      }
    }
    
    return false; // Should never reach here due to throw above
  } catch (error) {
    console.error('Fatal error reconnecting Prisma:', error);
    return false;
  }
};