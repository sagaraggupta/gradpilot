"use client"; // We need this because checking the current route happens in the browser

import { Home, Calendar, CheckSquare, Wallet } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function MobileNav() {
  // This hook tells us the current URL (e.g., "/" or "/attendance")
  const pathname = usePathname();

  const navItems = [
    { name: "Home", href: "/", icon: Home },
    { name: "Attendance", href: "/attendance", icon: Calendar },
    { name: "Tasks", href: "/assignments", icon: CheckSquare },
    { name: "Expenses", href: "/expenses", icon: Wallet },
  ];

  return (
    // md:hidden ensures this completely disappears on laptops and desktops
    // fixed bottom-0 locks it to the bottom of the phone screen
    <nav className="md:hidden fixed bottom-0 left-0 w-full bg-zinc-900 border-t border-zinc-800 flex justify-around items-center pb-safe pt-2 px-2 z-50">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;
        
        return (
          <Link 
            key={item.name} 
            href={item.href}
            className={`flex flex-col items-center gap-1 p-2 min-w-[64px] transition-colors ${
              isActive ? "text-blue-500" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {/* If the tab is active, we make the icon filled/bolder by adding a background glow */}
            <div className={`p-1.5 rounded-full ${isActive ? 'bg-blue-500/10' : ''}`}>
              <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
            </div>
            <span className="text-[10px] font-medium">{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}