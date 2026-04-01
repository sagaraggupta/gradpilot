import React, { useMemo } from 'react';

export default function XPSourceTracker({ habits, goals, totalXp }) {
  const { habitXp, goalXp, timerXp, habitPct, goalPct, timerPct } = useMemo(() => {
    // 1. Calculate Habit XP (50 XP per streak day)
    const hXp = habits.reduce((acc, h) => acc + (h.streak * 50), 0);
    // 2. Calculate Goal XP (500 for complete, 5 per % otherwise)
    const gXp = goals.reduce((acc, g) => acc + (g.progress === 100 ? 500 : g.progress * 5), 0);
    // 3. Assume the rest came from the Focus Timer & Tasks
    const tXp = Math.max(0, (totalXp || 0) - hXp - gXp);

    const safeTotal = totalXp || 1; 

    return {
      habitXp: hXp, goalXp: gXp, timerXp: tXp,
      habitPct: Math.round((hXp / safeTotal) * 100),
      goalPct: Math.round((gXp / safeTotal) * 100),
      timerPct: Math.round((tXp / safeTotal) * 100)
    };
  }, [habits, goals, totalXp]);

  return (
    <div className="bg-[#0d0d14] border border-white/5 rounded-xl p-4 mt-4 animate-[fadeIn_0.5s_ease-out]">
      <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3">Lifetime XP Sources</div>
      
      {/* The Stacked Progress Bar */}
      <div className="w-full h-3 rounded-full flex overflow-hidden mb-4 bg-white/5">
        <div style={{ width: `${habitPct}%` }} className="bg-orange-500 h-full transition-all" title="Habits"></div>
        <div style={{ width: `${goalPct}%` }} className="bg-purple-500 h-full transition-all" title="Goals"></div>
        <div style={{ width: `${timerPct}%` }} className="bg-indigo-500 h-full transition-all" title="Timer & Tasks"></div>
      </div>

      {/* The Legend */}
      <div className="grid grid-cols-3 gap-2">
        <div>
          <div className="flex items-center gap-1.5 mb-1"><div className="w-2 h-2 rounded-full bg-orange-500"></div><span className="text-[10px] text-white/50 uppercase font-bold">Habits</span></div>
          <div className="text-[13px] font-bold text-slate-200">{habitXp.toLocaleString()} <span className="text-[10px] text-white/30 font-normal">XP</span></div>
        </div>
        <div>
          <div className="flex items-center gap-1.5 mb-1"><div className="w-2 h-2 rounded-full bg-purple-500"></div><span className="text-[10px] text-white/50 uppercase font-bold">Goals</span></div>
          <div className="text-[13px] font-bold text-slate-200">{goalXp.toLocaleString()} <span className="text-[10px] text-white/30 font-normal">XP</span></div>
        </div>
        <div>
          <div className="flex items-center gap-1.5 mb-1"><div className="w-2 h-2 rounded-full bg-indigo-500"></div><span className="text-[10px] text-white/50 uppercase font-bold">Timer</span></div>
          <div className="text-[13px] font-bold text-slate-200">{timerXp.toLocaleString()} <span className="text-[10px] text-white/30 font-normal">XP</span></div>
        </div>
      </div>
    </div>
  );
}