import React, { useMemo } from 'react';

export default function SessionAnalytics({ studyHistory }) {
  const stats = useMemo(() => {
    if (!studyHistory || studyHistory.length === 0) return null;

    let totalMins = 0;
    const moodCounts = { great: 0, okay: 0, struggled: 0 };
    let deepWorkCount = 0;

    studyHistory.forEach(s => {
      totalMins += s.duration_minutes || 0;
      if (s.mood) moodCounts[s.mood]++;
      if (s.duration_minutes >= 60) deepWorkCount++;
    });

    const avgTime = Math.round(totalMins / studyHistory.length);
    
    // Determine Best Mood
    let bestMood = "N/A";
    if (moodCounts.great >= moodCounts.okay && moodCounts.great >= moodCounts.struggled) bestMood = "🟢 Great";
    else if (moodCounts.okay >= moodCounts.struggled) bestMood = "🟡 Okay";
    else bestMood = "🔴 Struggled";

    // Custom Productivity Score (0-100)
    // Formula: Combines consistency (count), deep work ratio, and mood.
    const baseScore = Math.min(50, studyHistory.length * 2); 
    const deepWorkBonus = Math.min(30, deepWorkCount * 5);
    const moodBonus = Math.min(20, (moodCounts.great * 2));
    const prodScore = baseScore + deepWorkBonus + moodBonus;

    return { avgTime, bestMood, prodScore: Math.min(100, prodScore) };
  }, [studyHistory]);

  if (!stats) return null;

  return (
    <div className="w-full max-w-[650px] mt-4 bg-white/5 border border-white/10 rounded-2xl p-5 animate-[fadeIn_0.5s_ease-out]">
      <h3 className="text-[14px] font-bold text-slate-200 mb-4 flex items-center gap-2">
        <span className="text-lg">📈</span> Lifetime Analytics
      </h3>
      
      <div className="grid grid-cols-3 gap-4">
        <div className="flex flex-col items-center justify-center p-3 bg-[#0d0d14] rounded-xl border border-white/5">
          <span className="text-[11px] text-white/40 uppercase tracking-wider mb-1">Avg Session</span>
          <span className="text-lg font-bold text-slate-200">{stats.avgTime}m</span>
        </div>
        <div className="flex flex-col items-center justify-center p-3 bg-[#0d0d14] rounded-xl border border-white/5">
          <span className="text-[11px] text-white/40 uppercase tracking-wider mb-1">Frequent Mood</span>
          <span className="text-lg font-bold text-slate-200">{stats.bestMood}</span>
        </div>
        <div className="flex flex-col items-center justify-center p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
          <span className="text-[11px] text-indigo-300/70 uppercase tracking-wider mb-1">Prod. Score</span>
          <span className="text-xl font-extrabold text-indigo-400">{stats.prodScore}<span className="text-sm">/100</span></span>
        </div>
      </div>
    </div>
  );
}