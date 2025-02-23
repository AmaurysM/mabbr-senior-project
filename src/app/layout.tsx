"use client";

import "./globals.css";
import { usePathname } from "next/navigation";
import dynamic from 'next/dynamic';

const Navbar = dynamic(() => import("./navbar"));
const Toaster = dynamic(() => import("sonner").then((mod) => mod.Toaster));

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();

  const isLandingPage = pathname === "/";

  return (
    <html lang="en">
      <head>
        {/* Preload the background image */}
        <link rel="preload" as="image" href="/sunny-landscape-tini.jpg" type="image/jpg" />
      </head>
      <body className="min-h-screen bg-[#1a1b26]">
        {!isLandingPage && <Navbar />}
        <main className={`${!isLandingPage ? 'pt-[64px]' : ''}`}>
          {children}
        </main>
        {/* Lazy load the Toaster component */}
        <Toaster />
      </body>
    </html>
  );
}
