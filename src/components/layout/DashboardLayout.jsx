import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function DashboardLayout() {
  // This state controls whether the desktop sidebar is wide or thin
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-[#0d0d14] overflow-hidden font-sans">
      
      {/* 1. We pass the state to the Sidebar so the toggle button works */}
      <Sidebar 
        isCollapsed={isCollapsed} 
        toggleCollapse={() => setIsCollapsed(!isCollapsed)} 
      />
      
      {/* 2. THE CRITICAL FIX: The dynamic margin (ml-64 or ml-20) physically pushes the screen to the right so it never overlaps! */}
      <div 
        className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out w-full pt-16 md:pt-0
          ${isCollapsed ? "md:ml-20" : "md:ml-64"}
        `}
      >
        <Topbar />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-8 animate-[fadeIn_0.3s_ease]">
          <Outlet />
        </main>
      </div>

    </div>
  );
}