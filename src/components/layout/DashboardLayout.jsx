import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { useAuth } from "../../contexts/AuthContext";
import { runBackgroundStreakCheck } from "../../lib/streakEngine";
import { Icon, Icons } from "../ui/Icon";

export default function DashboardLayout() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user } = useAuth();
  
  // New state to hold streak penalty/freeze alerts
  const [streakAlert, setStreakAlert] = useState(null);

  useEffect(() => {
    if (user) {
      // 🧠 LOGIC FIX: Check Session Storage so it only runs once per browser session!
      const hasChecked = sessionStorage.getItem('hasCheckedStreak_Today');
      
      if (!hasChecked) {
        runBackgroundStreakCheck(user.id).then(res => {
          if (res) setStreakAlert(res);
          // Flag it as checked so it doesn't run again until they close the tab
          sessionStorage.setItem('hasCheckedStreak_Today', 'true');
        });
      }
    }
  }, [user]);

  return (
    <div className="flex h-screen bg-[#0d0d14] overflow-hidden font-sans">
      <Sidebar isCollapsed={isCollapsed} toggleCollapse={() => setIsCollapsed(!isCollapsed)} />
      
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out w-full pt-16 md:pt-0 ${isCollapsed ? "md:ml-20" : "md:ml-64"}`}>
        <Topbar />
        
        {/* THE STREAK ALERT BANNER */}
        {streakAlert && (
          <div className={`mx-4 md:mx-8 mt-6 p-4 rounded-2xl border flex items-center justify-between shadow-lg animate-[fadeIn_0.5s_ease-out] shrink-0
            ${streakAlert.type === 'freeze_used' ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}
          `}>
            <div className="flex items-center gap-4">
              <div className="text-3xl drop-shadow-md">{streakAlert.type === 'freeze_used' ? '🧊' : '💔'}</div>
              <div>
                <h4 className="font-extrabold text-[15px] tracking-tight">{streakAlert.type === 'freeze_used' ? 'Streak Freeze Activated!' : 'Streak Lost'}</h4>
                <p className="text-[13px] opacity-80 mt-0.5">{streakAlert.message}</p>
              </div>
            </div>
            <button onClick={() => setStreakAlert(null)} className="p-2 hover:bg-white/10 rounded-xl transition-colors shrink-0">
              <Icon d={Icons.x} size={18} />
            </button>
          </div>
        )}

        <main className="flex-1 overflow-y-auto p-4 md:p-8 animate-[fadeIn_0.3s_ease]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}