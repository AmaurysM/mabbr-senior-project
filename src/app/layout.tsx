'use client';

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "./navbar";
import { usePathname  } from "next/navigation";



export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();

  // Check if we're on the landing page (i.e., home page)
  const isLandingPage = pathname === '/';

  return (
    <html lang="en">
      <body>
        {/* Render Navbar only if it's not the landing page */}
        {!isLandingPage && <Navbar />}
        {children}
      </body>
    </html>
  );
}
