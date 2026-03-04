import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/ToastContext";
import AuthGuard from "@/components/AuthGuard";

export const viewport: Viewport = {
  themeColor: "#09090b",
  colorScheme: "dark",
};

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
    <html lang="en" className="dark">
      <body className="bg-zinc-950 text-white antialiased flex"> 
        <ToastProvider>
          {/* We wrap the whole app in the Bouncer! */}
          <AuthGuard>
            {children}
          </AuthGuard>
        </ToastProvider>
      </body>
    </html>
  );
}