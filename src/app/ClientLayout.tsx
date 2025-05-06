"use client";

import React, { useEffect } from 'react';
import { useHeartbeat } from '@/hooks/useHeartbeat';
import { authClient } from '@/lib/auth-client';
import { useToast } from '@/app/hooks/use-toast';

type ClientLayoutProps = {
  children: React.ReactNode;
};

export default function ClientLayout({ children }: ClientLayoutProps) {
  // Use heartbeat hook to keep session active (30 seconds interval)
  useHeartbeat(30000);
  const { data: session } = authClient.useSession();
  const { toast } = useToast();

  // Trigger daily draw selection once per day when user logs in
  useEffect(() => {
    if (!session?.user) return;
    const todayKey = new Date().toISOString().split('T')[0];
    const lastRun = localStorage.getItem('daily-draw-trigger-date');
    if (lastRun === todayKey) return;
    fetch('/api/games/daily-draw/select-winner', { method: 'POST' })
      .then(res => res.json())
      .then(data => {
        if (data.success && !data.alreadySelected) {
          toast({ title: 'Daily Draw', description: 'A winner has been selected for today!' });
        }
        localStorage.setItem('daily-draw-trigger-date', todayKey);
      })
      .catch(err => console.error('Error triggering daily draw:', err));
  }, [session?.user]);

  return <>{children}</>;
} 