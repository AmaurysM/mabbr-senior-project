import "./globals.css";
import { Toaster } from "react-hot-toast";
import Navbar from "./navbar";
import ClientLayout from "./ClientLayout";

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="h-screen bg-gray-800 flex flex-col">
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
