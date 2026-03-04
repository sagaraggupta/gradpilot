"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Sidebar from "./Sidebar";
import MobileNav from "./MobileNav";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 1. Check if the user has a session (is logged in)
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session && pathname !== "/login") {
        router.push("/login"); // Kick them to login if they aren't authenticated
      } else if (session && pathname === "/login") {
        router.push("/"); // Send them to dashboard if they are already logged in
      }
      setIsLoading(false);
    };
    
    checkUser();

    // 2. Listen for logouts and instantly kick them out
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session && pathname !== "/login") {
        router.push("/login");
      }
    });

    return () => authListener.subscription.unsubscribe();
  }, [pathname, router]);

  // Show a black screen for a split second while we check their ID
  if (isLoading) {
    return <div className="h-screen w-full bg-zinc-950 flex items-center justify-center text-zinc-500">Loading GradPilot...</div>;
  }

  // If they are on the login page, ONLY show the login page (no sidebars!)
  if (pathname === "/login") {
    return <>{children}</>;
  }

  // If they are logged in, show the full app with the Navigation menus
  return (
    <>
      <Sidebar />
      <div className="flex-1 md:ml-64 p-4 md:p-8 pb-24 md:pb-8 h-screen overflow-y-auto">
        {children}
      </div>
      <MobileNav />
    </>
  );
}