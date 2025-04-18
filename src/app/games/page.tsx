"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function GamesPage() {
  const router = useRouter();

  useEffect(() => {
    // Check if there's a stored active tab
    const storedActive = localStorage.getItem("activeGamesComponent");
    
    // Redirect to the stored tab or default to daily draw
    if (storedActive) {
      router.push(`/games/${storedActive.replace(/([A-Z])/g, '-$1').toLowerCase()}`);
    } else {
      router.push('/games/daily-draw');
    }
  }, [router]);

  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-gray-400">Loading games...</div>
    </div>
  );
} 