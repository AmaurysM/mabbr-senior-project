import "./globals.css";
import { Toaster } from "./components/ui/sonner";
import Navbar from "./navbar";

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-gray-800">
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
