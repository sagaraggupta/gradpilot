import React from "react";

export default function Badge({ children, color = "pending" }) {
  const colors = {
    high: "bg-red-500/20 text-red-300 border-red-500/30",
    medium: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    low: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    completed: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    "in-progress": "bg-blue-500/20 text-blue-300 border-blue-500/30",
    pending: "bg-slate-500/20 text-slate-300 border-slate-500/30",
    overdue: "bg-red-500/20 text-red-300 border-red-500/30",
  };
  
  return (
    <span className={`text-[11px] px-2 py-0.5 rounded-full border font-medium ${colors[color] || colors.pending}`}>
      {children}
    </span>
  );
}