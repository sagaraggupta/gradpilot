import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav"; // 1. IMPORT THE NEW NAV
import { ToastProvider } from "@/components/ToastContext";

export const metadata: Metadata = {
  title: "GradPilot",
  description: "Your Academic Control Center",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-zinc-950 text-white antialiased flex"> 
        <ToastProvider>
          {/* Sidebar shows on Desktop, hides on Mobile */}
          <Sidebar />
          
          {/* 2. We changed pb-8 to pb-24 (padding-bottom) so content doesn't get stuck under the mobile nav! */}
          <div className="flex-1 md:ml-64 p-4 md:p-8 pb-24 md:pb-8 h-screen overflow-y-auto">
            {children} 
          </div>

          {/* MobileNav shows on Mobile, hides on Desktop */}
          <MobileNav />
        </ToastProvider>
      </body>
    </html>
  );
}