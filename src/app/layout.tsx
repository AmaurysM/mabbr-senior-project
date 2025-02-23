import "./globals.css";
import Navbar from "./Navbar";
import { Toaster } from "./components/ui/sonner";

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
        <Toaster />
      </body>
    </html>
  );
}
