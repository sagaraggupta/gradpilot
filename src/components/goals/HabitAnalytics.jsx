import React, { useMemo } from 'react';

export default function HabitAnalytics({ habits }) {
  const { bestHabit, weakHabit, activeConsistency } = useMemo(() => {
    if (!habits || habits.length === 0) return { bestHabit: "-", weakHabit: "-", activeConsistency: 0 };

    let best = habits[0];
    let weak = habits[0];
    let totalStreaks = 0;

    habits.forEach(h => {
      if (h.streak > best.streak) best = h;
      if (h.streak < weak.streak) weak = h;
      totalStreaks += h.streak;
    });

    // Calculate a rough "Consistency Score" based on how many habits have active streaks
    const habitsWithStreaks = habits.filter(h => h.streak > 0).length;
    const consistency = Math.round((habitsWithStreaks / habits.length) * 100);

    return { 
      bestHabit: best.name, 
      weakHabit: weak.name, 
      activeConsistency: consistency 
    };
  }, [habits]);

  if (habits.length === 0) return null;

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 h-full flex flex-col justify-center animate-[fadeIn_0.5s_ease-out]">
      <h3 className="text-slate-100 font-bold text-[15px] mb-4 flex items-center gap-2">
        <span className="text-lg">📊</span> Habit Analytics
      </h3>
      
      <div className="grid grid-cols-1 gap-3">
        <div className="flex justify-between items-center p-3 bg-[#0d0d14] rounded-xl border border-white/5">
          <span className="text-[11px] text-white/40 uppercase tracking-wider font-bold">Active Consistency</span>
          <span className={`text-[15px] font-extrabold ${activeConsistency >= 70 ? 'text-green-400' : activeConsistency >= 40 ? 'text-amber-400' : 'text-red-400'}`}>
            {activeConsistency}%
          </span>
        </div>
        
        <div className="flex justify-between items-center p-3 bg-green-500/5 rounded-xl border border-green-500/10">
          <span className="text-[11px] text-green-400/70 uppercase tracking-wider font-bold">🌟 Strongest</span>
          <span className="text-[13px] font-bold text-green-400 truncate max-w-[120px]" title={bestHabit}>{bestHabit}</span>
        </div>
        
        <div className="flex justify-between items-center p-3 bg-red-500/5 rounded-xl border border-red-500/10">
          <span className="text-[11px] text-red-400/70 uppercase tracking-wider font-bold">⚠️ Weakest</span>
          <span className="text-[13px] font-bold text-red-400 truncate max-w-[120px]" title={weakHabit}>{weakHabit}</span>
        </div>
      </div>
    </div>
  );
}