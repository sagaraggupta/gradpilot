import React, { useMemo } from 'react';

export default function AIPredictorCard({ subjects }) {
  const prediction = useMemo(() => {
    if (!subjects || subjects.length === 0) return null;

    // 1. Figure out what day tomorrow is
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = days[tomorrow.getDay()];

    // 2. Find classes scheduled for tomorrow
    const tomorrowsClasses = subjects.filter(s => s.days?.includes(tomorrowStr));

    if (tomorrowsClasses.length === 0) {
      return { status: 'free' }; 
    }

    const risks = [];
    const safe = [];

    // 3. The Prediction Algorithm (Simulate skipping)
    tomorrowsClasses.forEach(s => {
      // If they skip, the total classes increase by 1, but present stays the same
      const projectedPct = (s.total + 1) > 0 ? (s.present / (s.total + 1)) * 100 : 0;

      if (projectedPct < s.required) {
        risks.push({ ...s, projectedPct: Math.round(projectedPct) });
      } else {
        safe.push({ ...s, projectedPct: Math.round(projectedPct) });
      }
    });

    // 4. Generate the Verdict
    if (risks.length > 0) {
      return {
        status: 'danger',
        title: "Do Not Bunk Tomorrow ⚠️",
        message: `Skipping tomorrow will drop ${risks.map(r => r.subject).join(" & ")} below your target!`,
        risks, safe, tomorrowStr
      };
    } else {
      return {
        status: 'safe',
        title: "Safe to Bunk Tomorrow 🛌",
        message: "You have enough buffer in all of tomorrow's classes to take a day off.",
        risks, safe, tomorrowStr
      };
    }
  }, [subjects]);

  // Hide the card if they have no classes tomorrow or no data
  if (!prediction || prediction.status === 'free') return null;

  const isSafe = prediction.status === 'safe';

  return (
    <div className={`relative overflow-hidden rounded-2xl p-6 mb-6 border shadow-2xl ${isSafe ? 'bg-gradient-to-br from-[#0d0d14] to-emerald-900/20 border-emerald-500/30' : 'bg-gradient-to-br from-[#0d0d14] to-red-900/20 border-red-500/30'}`}>
      
      {/* Background Glow */}
      <div className={`absolute top-0 right-0 w-64 h-64 blur-[80px] rounded-full opacity-20 pointer-events-none ${isSafe ? 'bg-emerald-500' : 'bg-red-500'}`}></div>

      <div className="relative z-10 flex flex-col md:flex-row gap-6 items-start md:items-center">
        
        {/* Left Side: The Verdict */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">🤖</span>
            <span className="text-[11px] font-bold uppercase tracking-widest text-white/50">AI Prediction Engine</span>
          </div>
          <h3 className={`text-[20px] font-extrabold tracking-tight mb-2 ${isSafe ? 'text-emerald-400' : 'text-red-400'}`}>
            {prediction.title}
          </h3>
          <p className="text-[13px] text-slate-300 font-medium leading-relaxed">
            {prediction.message}
          </p>
        </div>

        {/* Right Side: The Math Breakdown */}
        <div className="w-full md:w-auto flex flex-col gap-2 shrink-0 bg-[#0d0d14]/50 border border-white/5 p-4 rounded-xl">
          <div className="text-[10px] uppercase font-bold text-white/40 tracking-wider mb-1">If you skip on {prediction.tomorrowStr}:</div>
          
          {prediction.risks.map(r => (
            <div key={r.id} className="flex items-center justify-between gap-6">
              <span className="text-[12px] font-bold text-slate-200">{r.subject}</span>
              <div className="text-right">
                <span className="text-[12px] font-extrabold text-red-400">{r.projectedPct}%</span>
                <span className="text-[10px] text-white/40 ml-1">(Target: {r.required}%)</span>
              </div>
            </div>
          ))}
          
          {prediction.safe.map(s => (
            <div key={s.id} className="flex items-center justify-between gap-6">
              <span className="text-[12px] font-bold text-slate-200">{s.subject}</span>
              <div className="text-right">
                <span className="text-[12px] font-extrabold text-emerald-400">{s.projectedPct}%</span>
                <span className="text-[10px] text-white/40 ml-1">(Target: {s.required}%)</span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}