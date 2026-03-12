import React, { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import { Icon, Icons } from "../ui/Icon";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";

export default function Topbar() {
  const { user } = useAuth();
  const location = useLocation();
  const [walletXP, setWalletXP] = useState(0);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  // Dynamic Page Title based on URL
  const getPageTitle = () => {
    const path = location.pathname.split("/")[1];
    if (!path) return "Dashboard";
    return path.charAt(0).toUpperCase() + path.slice(1);
  };

  // Fetch Real XP on load
  useEffect(() => {
    const fetchRealXP = async () => {
      const [ { data: hData }, { data: gData }, { data: sData } ] = await Promise.all([
        supabase.from('habits').select('streak'),
        supabase.from('goals').select('progress'),
        supabase.from('user_settings').select('xp_spent').eq('user_id', user.id).single()
      ]);

      let earned = 0;
      if (hData) hData.forEach(h => earned += (h.streak * 50));
      if (gData) gData.forEach(g => { earned += (g.progress === 100 ? 500 : g.progress * 5); });
      
      const spent = sData?.xp_spent || 0;
      setWalletXP(earned - spent);
    };

    fetchRealXP();
  }, [user, location.pathname]); // Re-fetch when changing pages so it stays updated!

  return (
    <div className="h-20 border-b border-white/5 bg-[#0d0d14]/80 backdrop-blur-xl flex items-center justify-between px-6 lg:px-10 sticky top-0 z-40">
      
      {/* Left: Dynamic Title */}
      <div className="hidden md:block">
        <h1 className="text-xl font-bold text-slate-100 tracking-tight">{getPageTitle()}</h1>
        <p className="text-[11px] font-medium text-white/40 uppercase tracking-widest mt-0.5">Welcome back, Pilot</p>
      </div>

      {/* Center & Right: Controls */}
      <div className="flex items-center gap-4 ml-auto w-full md:w-auto justify-end">
        
        {/* Interactive Search Bar */}
        <div className="relative w-full md:w-64">
          <div className={`flex items-center bg-[#13131a] border rounded-xl px-3 py-2 transition-colors ${isSearchOpen ? 'border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.1)]' : 'border-white/5'}`}>
            <Icon d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" size={16} className="text-white/40" />
            <input 
              type="text" 
              placeholder="Quick search..." 
              className="bg-transparent border-none text-[13px] text-slate-200 ml-2 w-full outline-none placeholder:text-white/30"
              onFocus={() => setIsSearchOpen(true)}
              onBlur={() => setTimeout(() => setIsSearchOpen(false), 200)}
            />
          </div>

          {/* Dummy Search Results Dropdown */}
          {isSearchOpen && (
            <div className="absolute top-full mt-2 w-full bg-[#1a1a24] border border-white/10 rounded-xl shadow-2xl overflow-hidden py-2 z-50 animate-[fadeIn_0.1s_ease-out]">
              <div className="px-3 py-1.5 text-[10px] font-bold text-white/30 uppercase tracking-widest">Quick Actions</div>
              <Link to="/timer" className="flex items-center gap-2 px-4 py-2 text-[13px] text-slate-300 hover:bg-white/5 hover:text-indigo-300 transition-colors"><span className="text-indigo-400">⏱️</span> Start Focus Timer</Link>
              <Link to="/ai" className="flex items-center gap-2 px-4 py-2 text-[13px] text-slate-300 hover:bg-white/5 hover:text-indigo-300 transition-colors"><span className="text-purple-400">🤖</span> Ask AI Assistant</Link>
              <Link to="/assignments" className="flex items-center gap-2 px-4 py-2 text-[13px] text-slate-300 hover:bg-white/5 hover:text-indigo-300 transition-colors"><span className="text-amber-400">📝</span> Add Assignment</Link>
            </div>
          )}
        </div>

        <div className="w-px h-6 bg-white/10 hidden md:block"></div>

        {/* Real XP Wallet */}
        <div className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 px-3 py-1.5 rounded-lg">
          <span className="text-amber-400 text-sm drop-shadow-md">⚡</span>
          <span className="text-[13px] font-extrabold text-amber-400">{walletXP.toLocaleString()} XP</span>
        </div>

        {/* Interactive Notifications */}
        <div className="relative">
          <button 
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-colors relative ${isNotifOpen ? 'bg-white/10 border-white/20 text-white' : 'bg-[#13131a] border-white/5 text-white/50 hover:bg-white/5 hover:text-white'}`}
          >
            <Icon d={Icons.bell} size={18} />
            <span className="absolute top-2 right-2.5 w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse"></span>
          </button>

          {/* Notifications Dropdown */}
          {isNotifOpen && (
            <div className="absolute top-full right-0 mt-2 w-72 bg-[#1a1a24] border border-white/10 rounded-xl shadow-2xl overflow-hidden py-2 z-50 animate-[fadeIn_0.1s_ease-out]">
              <div className="flex justify-between items-center px-4 py-2 border-b border-white/5 mb-2">
                <span className="text-[12px] font-bold text-slate-200">Notifications</span>
                <button className="text-[10px] text-indigo-400 font-bold hover:text-indigo-300">Mark all read</button>
              </div>
              <div className="px-4 py-2 hover:bg-white/5 transition-colors cursor-pointer">
                <div className="text-[12px] font-bold text-slate-200 flex items-center gap-1.5"><span className="text-red-400">⚠️</span> High Priority Task Due</div>
                <div className="text-[11px] text-white/40 mt-0.5">Check your assignments tab.</div>
              </div>
              <div className="px-4 py-2 hover:bg-white/5 transition-colors cursor-pointer">
                <div className="text-[12px] font-bold text-slate-200 flex items-center gap-1.5"><span className="text-amber-400">🔥</span> Habit Reminder</div>
                <div className="text-[11px] text-white/40 mt-0.5">Don't lose your 5-day streak today!</div>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Outline */}
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 p-[2px] cursor-pointer hover:scale-105 transition-transform">
          <div className="w-full h-full bg-[#0d0d14] rounded-[10px] flex items-center justify-center text-sm font-bold text-slate-200">
            {user?.email?.charAt(0).toUpperCase() || "U"}
          </div>
        </div>

      </div>
    </div>
  );
}