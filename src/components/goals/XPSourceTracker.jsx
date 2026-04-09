import React, { useMemo } from 'react';

export default function XPSourceTracker({ habits, goals, pilotScore }) {
  const { habitScore, goalScore, timerScore, habitPct, goalPct, timerPct } = useMemo(() => {
    // 1. Calculate Habit Score (50 Score per streak day)
    const hScore = habits.reduce((acc, h) => acc + (h.streak * 50), 0);
    // 2. Calculate Goal Score (500 for complete, 5 per % otherwise)
    const gScore = goals.reduce((acc, g) => acc + (g.progress === 100 ? 500 : g.progress * 5), 0);
    // 3. Assume the rest came from the Focus Timer & Tasks
    const tScore = Math.max(0, (pilotScore || 0) - hScore - gScore);

    const safeTotal = pilotScore || 1; 

    return {
      habitScore: hScore, goalScore: gScore, timerScore: tScore,
      habitPct: Math.round((hScore / safeTotal) * 100),
      goalPct: Math.round((gScore / safeTotal) * 100),
      timerPct: Math.round((tScore / safeTotal) * 100)
    };
  }, [habits, goals, pilotScore]);

  return (
    <div className="bg-[#0d0d14] border border-white/5 rounded-xl p-4 mt-4 animate-[fadeIn_0.5s_ease-out]">
      <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3">Lifetime Score Sources</div>
      
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
          <div className="text-[13px] font-bold text-slate-200">{habitScore.toLocaleString()} <span className="text-[10px] text-white/30 font-normal">Score</span></div>
        </div>
        <div>
          <div className="flex items-center gap-1.5 mb-1"><div className="w-2 h-2 rounded-full bg-purple-500"></div><span className="text-[10px] text-white/50 uppercase font-bold">Goals</span></div>
          <div className="text-[13px] font-bold text-slate-200">{goalScore.toLocaleString()} <span className="text-[10px] text-white/30 font-normal">Score</span></div>
        </div>
        <div>
          <div className="flex items-center gap-1.5 mb-1"><div className="w-2 h-2 rounded-full bg-indigo-500"></div><span className="text-[10px] text-white/50 uppercase font-bold">Timer</span></div>
          <div className="text-[13px] font-bold text-slate-200">{timerScore.toLocaleString()} <span className="text-[10px] text-white/30 font-normal">Score</span></div>
        </div>
      </div>
    </div>
  );
}