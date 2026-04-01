import React, { useMemo } from 'react';
import ProgressBar from '../ui/ProgressBar';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function GradeInsights({ cgpa, grades, gradeDistribution, GRADE_SCALE }) {
  
  // ─── 🧠 MATH ENGINE: Semester Trend Data ───
  const trendData = useMemo(() => {
    if (!grades || grades.length === 0) return [];
    
    // Get unique, numerically sorted semesters
    const sems = [...new Set(grades.map(g => g.semester))].sort((a, b) => 
      parseInt(a.split(" ")[1]) - parseInt(b.split(" ")[1])
    );
    
    // Calculate SGPA for each semester
    return sems.map(sem => {
      const semGrades = grades.filter(g => g.semester === sem);
      let credits = 0;
      let points = 0;
      semGrades.forEach(g => {
        credits += g.credits;
        points += g.credits * (GRADE_SCALE[g.grade]?.points || 0);
      });
      return {
        name: sem.replace("Semester ", "S"), // Shorten for the X-Axis (e.g., "S1")
        sgpa: credits === 0 ? 0 : Number((points / credits).toFixed(2))
      };
    });
  }, [grades, GRADE_SCALE]);

  // ─── 🧠 MATH ENGINE: Performance Insights ───
  const { bestSubject, weakSubject } = useMemo(() => {
    if (!grades || grades.length === 0) return { bestSubject: "-", weakSubject: "-" };
    
    let best = grades[0];
    let weak = grades[0];
    
    grades.forEach(g => {
      if ((GRADE_SCALE[g.grade]?.points || 0) > (GRADE_SCALE[best.grade]?.points || 0)) best = g;
      if ((GRADE_SCALE[g.grade]?.points || 0) < (GRADE_SCALE[weak.grade]?.points || 0)) weak = g;
    });
    
    return { 
      bestSubject: best.subject.length > 15 ? best.subject.substring(0, 15) + '...' : best.subject, 
      weakSubject: weak.subject.length > 15 ? weak.subject.substring(0, 15) + '...' : weak.subject 
    };
  }, [grades, GRADE_SCALE]);

  return (
    <div className="flex flex-col gap-5 animate-[fadeIn_0.3s_ease-out]">
      
      {/* ─── OVERALL PERFORMANCE & MINI-INSIGHTS ─── */}
      <div className="grid grid-cols-2 gap-3">
        {/* Massive CGPA Box */}
        <div className="col-span-2 bg-gradient-to-br from-[#0d0d14] to-[#1a1a2e] border border-indigo-500/20 rounded-2xl p-6 text-center relative overflow-hidden shadow-[0_0_30px_rgba(99,102,241,0.05)]">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -mr-10 -mt-10" />
          <h3 className="text-white/40 text-[11px] uppercase tracking-widest font-bold mb-2">Overall Performance</h3>
          <div className="text-[64px] font-extrabold text-white font-['Sora'] leading-none tracking-tighter drop-shadow-[0_0_15px_rgba(129,140,248,0.3)]">
            {cgpa}
          </div>
          <div className="text-[13px] text-indigo-300 font-medium mt-2">Cumulative Grade Point Average</div>
        </div>

        {/* 🚀 NEW: Performance Insight Blocks */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 flex flex-col justify-center text-center hover:bg-white/[0.07] transition-colors">
          <span className="text-[9px] text-green-400 uppercase tracking-widest font-extrabold mb-1">🌟 Strongest</span>
          <span className="text-[12px] font-bold text-slate-200 truncate px-1" title={bestSubject !== "-" ? "Highest Grade Point" : ""}>{bestSubject}</span>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 flex flex-col justify-center text-center hover:bg-white/[0.07] transition-colors">
          <span className="text-[9px] text-red-400 uppercase tracking-widest font-extrabold mb-1">⚠️ Weakest</span>
          <span className="text-[12px] font-bold text-slate-200 truncate px-1" title={weakSubject !== "-" ? "Lowest Grade Point" : ""}>{weakSubject}</span>
        </div>
      </div>

      {/* ─── 🚀 NEW: SGPA TREND GRAPH ─── */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <h3 className="text-slate-100 font-semibold text-[15px] mb-5 flex items-center gap-2">
          📈 Semester Trend
        </h3>
        
        {trendData.length < 2 ? (
          <div className="text-center text-white/30 text-[12px] py-8 border border-dashed border-white/5 rounded-xl">
            Log at least 2 semesters to unlock trend graph.
          </div>
        ) : (
          <div className="h-[180px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                <YAxis domain={['dataMin - 0.5', 10]} stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a1a24', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px', color: '#fff' }}
                  itemStyle={{ fontWeight: 'bold', color: '#818cf8' }}
                  formatter={(value) => [value, 'SGPA']}
                />
                <Line 
                  type="monotone" dataKey="sgpa" stroke="#818cf8" strokeWidth={3} 
                  dot={{ r: 4, fill: '#0d0d14', stroke: '#818cf8', strokeWidth: 2 }} 
                  activeDot={{ r: 6, fill: '#818cf8' }} 
                  animationDuration={1500}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* ─── GRADE DISTRIBUTION ─── */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex-1">
        <h3 className="text-slate-100 font-semibold text-[15px] mb-5">Grade Distribution</h3>
        {grades.length === 0 ? (
          <div className="text-center text-white/30 text-[12px] py-10">Add grades to see distribution</div>
        ) : (
          <div className="flex flex-col gap-3">
            {Object.entries(GRADE_SCALE).map(([grade, config]) => {
              const count = gradeDistribution[grade];
              if (count === 0) return null;
              const pct = (count / grades.length) * 100;
              
              return (
                <div key={grade}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[12px] font-bold text-slate-300">{grade} <span className="text-white/30 font-normal">({count})</span></span>
                    <span className="text-[11px] font-medium" style={{ color: config.color }}>{Math.round(pct)}%</span>
                  </div>
                  <ProgressBar value={pct} color={config.color} height={6} />
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}