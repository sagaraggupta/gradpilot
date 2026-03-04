"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, CalendarDays, BookOpen, Wallet, LogOut, GraduationCap } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ToastContext";
import Image from "next/image";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { addToast } = useToast();

  const navItems = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Attendance", href: "/attendance", icon: CalendarDays },
    { name: "Assignments", href: "/assignments", icon: BookOpen },
    { name: "Expenses", href: "/expenses", icon: Wallet },
  ];

  const handleLogout = async () => {
    // 1. Tell Supabase to destroy the secure session
    await supabase.auth.signOut();
    
    // 2. Show a goodbye message
    addToast("Logged out successfully.", "info");
    
    // 3. The AuthGuard will automatically catch this and kick them to /login, 
    // but we can explicitly push them just to be safe!
    router.push("/login");
  };

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen fixed left-0 top-0 bg-zinc-950 border-r border-zinc-800">
      <div className="p-6 flex items-center mb-6">
        <Image 
          src="/logo-full.png" 
          alt="GradPilot" 
          width={180} 
          height={48} 
          className="w-auto h-10 object-contain" // h-10 sets a nice height, w-auto keeps its natural rectangular shape!
          priority
        />
      </div>

      <nav className="flex-1 px-4 flex flex-col gap-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link key={item.name} href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                isActive 
                  ? "bg-blue-600/10 text-blue-400" 
                  : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
              }`}
            >
              <Icon size={20} className={isActive ? "text-blue-500" : "text-zinc-500"} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* THE LOGOUT BUTTON AT THE BOTTOM */}
      <div className="p-4 border-t border-zinc-800">
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-zinc-400 hover:bg-rose-500/10 hover:text-rose-400 transition-all duration-200 group"
        >
          <LogOut size={20} className="text-zinc-500 group-hover:text-rose-500 transition-colors" />
          Log Out
        </button>
      </div>
    </aside>
  );
}