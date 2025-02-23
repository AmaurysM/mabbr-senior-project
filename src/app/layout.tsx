import "./globals.css";
import { Toaster } from "./components/ui/sonner";
import Navbar from "./navbar";

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#2a35a8]">
        <Navbar />
        
        <main className="">
          {children}
        </main>
        {/* Lazy load the Toaster component */}
        <Toaster />
      </body>
    </html>
  );
}
