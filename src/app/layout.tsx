import "./globals.css";
import { Toaster } from "react-hot-toast";
import Navbar from "./navbar";
import ClientLayout from "./ClientLayout";

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>M.A.B.B.R.</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta charSet="utf-8" />
        <meta name="description" content="Your personalized stock & social trading experience." />
        
        <meta name="apple-mobile-web-app-title" content="M.A.B.B.R." />
      </head>
      <body className="h-screen bg-gray-800 flex flex-col">
        {/* Portal container for Daily Market Pulse */}
        <div id="market-pulse-portal" className="relative z-[9999]" />
        
        <Navbar />
        <main className="flex-grow h-full overflow-auto">
          <ClientLayout>
            {children}
          </ClientLayout>
        </main>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#1f2937',
              color: '#fff',
            },
          }}
        />
      </body>
    </html>
  );
}
