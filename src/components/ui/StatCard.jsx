import React from "react";
import { Icon, Icons } from "./Icon";

export default function StatCard({ label, value, sub, icon, color, trend }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 relative overflow-hidden">
      <div 
        className="absolute -top-5 -right-5 w-20 h-20 rounded-full opacity-10" 
        style={{ backgroundColor: color }} 
      />
      <div className="flex justify-between items-start mb-3">
        <div 
          className="w-10 h-10 rounded-xl flex items-center justify-center" 
          style={{ backgroundColor: `${color}22`, color }}
        >
          <Icon d={Icons[icon]} size={18} stroke={color} />
        </div>
        {trend && (
          <span className={`text-[11px] px-2 py-0.5 rounded-full ${trend > 0 ? 'text-green-400 bg-green-400/20' : 'text-red-400 bg-red-400/20'}`}>
            {trend > 0 ? "↑" : "↓"} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div className="text-2xl font-bold text-slate-100 font-['Sora'] leading-none">{value}</div>
      <div className="text-[13px] text-white/50 mt-1">{label}</div>
      {sub && <div className="text-[11px] mt-1.5" style={{ color }}>{sub}</div>}
    </div>
  );
}