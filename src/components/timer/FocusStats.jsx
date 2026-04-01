import React from 'react';

export default function FocusStats({ sessionsToday, focusMinutes, currentStreak, dailyFocusGoal }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-[650px] mt-6">
      {[
        ["Sessions Today", sessionsToday, "🍅"], 
        ["Focus Time", `${Math.floor(focusMinutes / 60)}h ${focusMinutes % 60}m`, "⏱"], 
        ["Streak", `${currentStreak || 0} days`, "🔥"], 
        ["Daily Goal", `${Math.min(100, Math.round((focusMinutes / (dailyFocusGoal || 120)) * 100))}%`, "🎯"]
      ].map(([l, v, e]) => (
        <div key={l} className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center hover:bg-white/[0.07] transition-colors">
          <div className="text-2xl mb-2 drop-shadow-md">{e}</div>
          <div className="text-[17px] font-bold text-slate-100 font-['Plus_Jakarta_Sans'] leading-none mb-1">{v}</div>
          <div className="text-[11px] text-white/40 uppercase tracking-wide">{l}</div>
        </div>
      ))}
    </div>
  );
}