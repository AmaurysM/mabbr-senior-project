"use client";

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "./navbar";
import { usePathname } from "next/navigation";
import { Toaster } from "./components/ui/sonner";

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();

  // Check if we're on the landing page (i.e., home page)
  const isLandingPage = pathname === "/";

  return (
    <html lang="en">
      <body className="min-h-screen bg-[#1a1b26]">
        {!isLandingPage && <Navbar />}
        <main className={`${!isLandingPage ? 'pt-[64px]' : ''}`}>
          {children}
        </main>
        <Toaster />
      </body>
    </html>
  );
}
