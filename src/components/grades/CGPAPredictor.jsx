import React, { useState, useMemo } from 'react';

export default function CGPAPredictor({ grades, GRADE_SCALE, currentCgpa }) {
  // Simulator States
  const [futureCredits, setFutureCredits] = useState(20); 
  const [expectedGrade, setExpectedGrade] = useState("A");
  
  // Goal States
  const [targetCgpa, setTargetCgpa] = useState(8.5);

  // ─── MATH ENGINE ───
  const { currentCredits, currentPoints } = useMemo(() => {
    let c = 0; let p = 0;
    grades.forEach(g => {
      c += g.credits;
      p += (g.credits * (GRADE_SCALE[g.grade]?.points || 0));
    });
    return { currentCredits: c, currentPoints: p };
  }, [grades, GRADE_SCALE]);

  // Math 1: Calculate Simulated CGPA
  const simulatedCgpa = useMemo(() => {
    if (currentCredits === 0) return 0;
    const futurePoints = futureCredits * (GRADE_SCALE[expectedGrade]?.points || 0);
    return ((currentPoints + futurePoints) / (currentCredits + futureCredits)).toFixed(2);
  }, [currentCredits, currentPoints, futureCredits, expectedGrade, GRADE_SCALE]);

  // Math 2: Calculate Required Grade for Target
  const requiredGrade = useMemo(() => {
    if (currentCredits === 0) return { text: "Add current grades first", color: "text-white/40" };
    if (futureCredits <= 0) return { text: "Add future credits", color: "text-white/40" };
    
    const requiredTotalPoints = targetCgpa * (currentCredits + futureCredits);
    const neededPoints = requiredTotalPoints - currentPoints;
    const neededAvgPoint = neededPoints / futureCredits;

    if (neededAvgPoint > 10) return { text: "Mathematically Impossible 💀", color: "text-red-400" };
    if (neededAvgPoint <= 4) return { text: "Easy Pass (D or higher) 😴", color: "text-green-400" };

    // Find the closest grade letter needed
    let neededGrade = "O";
    let minDiff = 10;
    for (const [grade, config] of Object.entries(GRADE_SCALE)) {
      if (config.points >= neededAvgPoint && (config.points - neededAvgPoint) < minDiff) {
        neededGrade = grade;
        minDiff = config.points - neededAvgPoint;
      }
    }
    return { text: `Need avg ${neededAvgPoint.toFixed(1)} pts (${neededGrade}) 🎯`, color: "text-indigo-400" };
  }, [currentCredits, currentPoints, futureCredits, targetCgpa, GRADE_SCALE]);

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mt-5 animate-[fadeIn_0.4s_ease-out]">
      <h3 className="text-slate-100 font-bold text-[16px] mb-6 flex items-center gap-2">
        <span className="text-xl">🔮</span> Academic Strategy Engine
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* ─── LEFT: THE SIMULATOR ─── */}
        <div className="bg-[#0d0d14] border border-white/5 rounded-xl p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
          <h4 className="text-[13px] font-bold text-purple-400 mb-4">What-If Simulator</h4>
          
          <div className="flex items-center gap-3 mb-4">
            <span className="text-[12px] text-white/50">If I take</span>
            <input 
              type="number" min="1" max="50" value={futureCredits} onChange={(e) => setFutureCredits(Number(e.target.value))}
              className="w-16 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-center text-[13px] text-slate-200 outline-none focus:border-purple-500/50"
            />
            <span className="text-[12px] text-white/50">credits and average a</span>
            <select 
              value={expectedGrade} onChange={(e) => setExpectedGrade(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-[13px] text-slate-200 outline-none focus:border-purple-500/50 font-bold"
            >
              {Object.keys(GRADE_SCALE).map(g => <option key={g} value={g} className="bg-[#0d0d14]">{g}</option>)}
            </select>
          </div>

          <div className="flex items-end justify-between border-t border-white/5 pt-4 mt-2">
            <span className="text-[11px] text-white/40 uppercase tracking-wider font-bold">New CGPA Becomes</span>
            <span className="text-[28px] font-extrabold text-white font-['Sora'] leading-none">
              {simulatedCgpa} <span className="text-sm font-normal text-purple-400/50 ml-1">/{currentCgpa}</span>
            </span>
          </div>
        </div>

        {/* ─── RIGHT: THE GOAL TARGETER ─── */}
        <div className="bg-[#0d0d14] border border-white/5 rounded-xl p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
          <h4 className="text-[13px] font-bold text-indigo-400 mb-4">Goal Targeter</h4>
          
          <div className="flex items-center gap-3 mb-4">
            <span className="text-[12px] text-white/50">To reach a CGPA of</span>
            <input 
              type="number" step="0.1" min="4" max="10" value={targetCgpa} onChange={(e) => setTargetCgpa(Number(e.target.value))}
              className="w-20 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-center text-[13px] text-slate-200 outline-none focus:border-indigo-500/50 font-bold"
            />
            <span className="text-[12px] text-white/50">taking {futureCredits} credits...</span>
          </div>

          <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-2">
            <span className="text-[11px] text-white/40 uppercase tracking-wider font-bold">You Must Score</span>
            <span className={`text-[16px] font-extrabold ${requiredGrade.color} tracking-tight`}>
              {requiredGrade.text}
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}