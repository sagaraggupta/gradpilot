"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, CalendarDays, BookOpen, Wallet, LogOut } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ToastContext";

export default function MobileNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { addToast } = useToast();

  const navItems = [
    { name: "Home", href: "/", icon: LayoutDashboard },
    { name: "Classes", href: "/attendance", icon: CalendarDays },
    { name: "Tasks", href: "/assignments", icon: BookOpen },
    { name: "Money", href: "/expenses", icon: Wallet },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    addToast("Logged out.", "info");
    router.push("/login");
  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-zinc-950/90 backdrop-blur-lg border-t border-zinc-800 z-50 pb-safe">
      <nav className="flex items-center justify-around p-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link key={item.name} href={item.href}
              className={`flex flex-col items-center justify-center w-16 h-14 rounded-xl transition-colors ${
                isActive ? "text-blue-400" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <div className={`p-1 rounded-lg mb-1 ${isActive ? "bg-blue-500/20" : ""}`}>
                <Icon size={20} />
              </div>
              <span className="text-[10px] font-medium">{item.name}</span>
            </Link>
          );
        })}

        {/* MOBILE LOGOUT BUTTON */}
        <button 
          onClick={handleLogout}
          className="flex flex-col items-center justify-center w-16 h-14 rounded-xl text-zinc-500 hover:text-rose-400 transition-colors"
        >
          <div className="p-1 rounded-lg mb-1">
            <LogOut size={20} />
          </div>
          <span className="text-[10px] font-medium">Out</span>
        </button>
      </nav>
    </div>
  );
}