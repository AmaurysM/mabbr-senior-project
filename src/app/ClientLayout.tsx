"use client";

import React from 'react';
import { useHeartbeat } from '@/hooks/useHeartbeat';

type ClientLayoutProps = {
  children: React.ReactNode;
};

export default function ClientLayout({ children }: ClientLayoutProps) {
  // Use heartbeat hook to keep session active (30 seconds interval)
  useHeartbeat(30000);
  
  return <>{children}</>;
} 