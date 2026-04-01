import React from 'react';

export default function HabitHeatmap({ last30Days }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
      <h3 className="text-slate-100 font-semibold text-[16px] mb-6">30-Day Habit Activity</h3>
      <div className="flex flex-wrap gap-2">
        {last30Days.map((day, i) => {
          // Color intensity based on habit count
          let colorClass = "bg-[#0d0d14] border-white/5"; 
          if (day.count === 1) colorClass = "bg-emerald-900/40 border-emerald-900/50";
          if (day.count === 2) colorClass = "bg-emerald-600/60 border-emerald-600/50";
          if (day.count >= 3) colorClass = "bg-emerald-400 border-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.3)]";
          
          return (
            <div 
              key={i} 
              title={`${day.date}: ${day.count} habits`}
              className={`w-4 h-4 sm:w-6 sm:h-6 rounded-sm border ${colorClass} transition-colors hover:scale-125 cursor-help`}
            />
          );
        })}
      </div>
      <div className="flex items-center gap-2 mt-4 text-[10px] text-white/40 font-bold uppercase tracking-widest">
        <span>Less</span>
        <div className="w-3 h-3 rounded-sm bg-[#0d0d14] border border-white/5" />
        <div className="w-3 h-3 rounded-sm bg-emerald-900/40 border border-emerald-900/50" />
        <div className="w-3 h-3 rounded-sm bg-emerald-600/60 border border-emerald-600/50" />
        <div className="w-3 h-3 rounded-sm bg-emerald-400 border border-emerald-400" />
        <span>More</span>
      </div>
    </div>
  );
}