import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Icon, Icons } from "../ui/Icon";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";

const NAV_LINKS = [
  { name: "Dashboard", path: "/", icon: "home" },
  { name: "Analytics", path: "/analytics", icon: "chart" },
  { name: "Assignments", path: "/assignments", icon: "file" },
  { name: "Attendance", path: "/attendance", icon: "calendar" },
  { name: "Grades", path: "/grades", icon: "book" },
  { name: "Goals & XP", path: "/goals", icon: "star" },
  { name: "Expenses", path: "/expenses", icon: "expenses" },
  { name: "Focus Timer", path: "/timer", icon: "clock" },
];

export default function Sidebar({ isCollapsed, toggleCollapse }) {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [isMobileOpen, setIsMobileOpen] = useState(false); 
  
  // We use the props passed from AppLayout instead of local state!
  const isDesktopCollapsed = isCollapsed;
  const setIsDesktopCollapsed = toggleCollapse;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <>
      {/* ─── MOBILE HAMBURGER HEADER (Only visible on small screens) ─── */}
      <div className="md:hidden fixed top-0 left-0 w-full h-16 bg-[#0d0d14]/90 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-5 z-[60]">
        <div className="flex items-center gap-2">
          <img src="/GradPilot.png" alt="GradPilot" className="h-8 w-auto object-contain" />
        </div>
        <button onClick={() => setIsMobileOpen(!isMobileOpen)} className="text-white hover:text-indigo-400 transition-colors">
          <Icon d={isMobileOpen ? Icons.x : Icons.menu} size={28} />
        </button>
      </div>

      {/* ─── MOBILE DARK OVERLAY ─── */}
      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[40]" onClick={() => setIsMobileOpen(false)} />
      )}

      {/* ─── THE ACTUAL SIDEBAR (Handles both Mobile slide and Desktop shrink) ─── */}
      <div className={`fixed inset-y-0 left-0 z-[50] bg-[#0d0d14] border-r border-white/5 flex flex-col transform transition-all duration-300 ease-in-out pt-16 md:pt-0 
        ${isMobileOpen ? "translate-x-0 w-64" : "-translate-x-full md:translate-x-0"} 
        ${isDesktopCollapsed ? "md:w-20" : "md:w-64"}
      `}>
        
        {/* ─── DESKTOP LOGO & TOGGLE AREA ─── */}
        <div className="hidden md:flex h-20 items-center justify-between px-5 border-b border-white/5 shrink-0 overflow-hidden">
          
          <div className={`flex items-center transition-opacity duration-300 ${isDesktopCollapsed ? "opacity-0 w-0 hidden" : "opacity-100 w-auto"}`}>
            <img src="/GradPilot.png" alt="GradPilot" className="h-8 w-auto object-contain" />
          </div>
          
          {/* THE DESKTOP HAMBURGER BUTTON */}
          <button 
            onClick={() => setIsDesktopCollapsed(!isDesktopCollapsed)} 
            className={`text-white/50 hover:text-indigo-400 transition-colors shrink-0 ${isDesktopCollapsed ? "mx-auto" : ""}`}
            title="Toggle Sidebar"
          >
            <Icon d={Icons.menu} size={24} />
          </button>
        </div>

        {/* ─── NAVIGATION ─── */}
        <div className="flex-1 overflow-y-auto py-6 px-4 flex flex-col gap-1.5 no-scrollbar overflow-x-hidden">
          <div className={`text-[10px] font-bold text-white/30 uppercase tracking-widest px-2 mb-2 transition-opacity duration-200 ${isDesktopCollapsed ? "opacity-0 hidden" : "opacity-100"}`}>Main Menu</div>
          
          {NAV_LINKS.map((link) => (
            <NavLink 
              key={link.name} 
              to={link.path}
              onClick={() => setIsMobileOpen(false)}
              title={isDesktopCollapsed ? link.name : ""} // Shows a tooltip on hover when collapsed!
              className={({ isActive }) => `
                flex items-center gap-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-200 group whitespace-nowrap
                ${isActive ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'text-white/50 hover:bg-white/5 hover:text-slate-200 border border-transparent'}
                ${isDesktopCollapsed ? 'px-0 justify-center' : 'px-3'}
              `}
            >
              {({ isActive }) => (
                <>
                  <div className={`shrink-0 transition-colors ${isActive ? 'text-indigo-400' : 'text-white/40 group-hover:text-white/70'}`}>
                    <Icon d={Icons[link.icon]} size={18} />
                  </div>
                  <span className={`transition-opacity duration-200 ${isDesktopCollapsed ? "opacity-0 hidden" : "opacity-100"}`}>{link.name}</span>
                </>
              )}
            </NavLink>
          ))}

          <div className="mt-6 mb-2">
            <div className={`text-[10px] font-bold text-white/30 uppercase tracking-widest px-2 mb-2 transition-opacity duration-200 ${isDesktopCollapsed ? "opacity-0 hidden" : "opacity-100"}`}>Intelligence</div>
            <NavLink 
              to="/ai"
              onClick={() => setIsMobileOpen(false)}
              title={isDesktopCollapsed ? "AI Assistant" : ""}
              className={({ isActive }) => `
                flex items-center gap-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-200 group relative overflow-hidden whitespace-nowrap
                ${isActive ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30' : 'text-white/50 hover:bg-white/5 hover:text-slate-200 border border-transparent'}
                ${isDesktopCollapsed ? 'px-0 justify-center' : 'px-3'}
              `}
            >
              <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-purple-500/10 to-transparent blur-xl rounded-full" />
              <div className="text-purple-400 z-10 drop-shadow-md shrink-0"><Icon d={Icons.zap} size={18} /></div>
              <span className={`z-10 transition-opacity duration-200 ${isDesktopCollapsed ? "opacity-0 hidden" : "opacity-100"}`}>AI Assistant</span>
              {!isDesktopCollapsed && <span className="ml-auto text-[9px] font-extrabold bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-2 py-0.5 rounded-md shadow-sm z-10">PRO</span>}
            </NavLink>
          </div>
        </div>

        {/* ─── LOGOUT FOOTER ─── */}
        <div className={`p-4 border-t border-white/5 shrink-0 transition-all ${isDesktopCollapsed ? "flex justify-center" : ""}`}>
          <button 
            onClick={handleLogout}
            title={isDesktopCollapsed ? "Sign Out" : ""}
            className={`flex items-center gap-3 py-2.5 rounded-xl text-[13px] font-semibold text-red-400/70 hover:bg-red-500/10 hover:text-red-400 transition-colors whitespace-nowrap
              ${isDesktopCollapsed ? "justify-center w-10 px-0" : "w-full px-3"}
            `}
          >
            <Icon d={Icons.logOut} size={16} className="shrink-0" />
            <span className={`transition-opacity duration-200 ${isDesktopCollapsed ? "opacity-0 hidden" : "opacity-100"}`}>Sign Out</span>
          </button>
        </div>

      </div>
    </>
  );
}