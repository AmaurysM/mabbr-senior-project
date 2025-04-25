import { useEffect } from 'react';
import { authClient } from '@/lib/auth-client';

/**
 * Hook that sends periodic heartbeats to update the user's session
 * This helps with tracking online status for all users including those
 * who are logged in through cookies
 */
export const useHeartbeat = (intervalMs: number = 30000) => {
  const { data: session } = authClient.useSession();
  
  useEffect(() => {
    // Only set up heartbeat if user is logged in
    if (!session?.user) return;
    
    // Send initial heartbeat
    const sendHeartbeat = async () => {
      try {
        await fetch('/api/user/heartbeat', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
          }
        });
      } catch (error) {
        console.error('Error sending heartbeat:', error);
      }
    };
    
    // Send initial heartbeat
    sendHeartbeat();
    
    // Set up interval for regular heartbeats
    const intervalId = setInterval(sendHeartbeat, intervalMs);
    
    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, [session?.user, intervalMs]);
}; 