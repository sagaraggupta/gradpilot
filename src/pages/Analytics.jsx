import React, { useState, useEffect, useMemo } from "react";
import StatCard from "../components/ui/StatCard";
import ProgressBar from "../components/ui/ProgressBar";
import { Icon, Icons } from "../components/ui/Icon";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

export default function Analytics() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  
  const [data, setData] = useState({
    tasks: [], attendance: [], expenses: [], grades: [], habits: [], goals: [], settings: {}
  });

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      const [ tData, attData, eData, gData, hData, glData, sData ] = await Promise.all([
        supabase.from('tasks').select('*'),
        supabase.from('attendance').select('*'),
        supabase.from('expenses').select('*'),
        supabase.from('grades').select('*').order('semester', { ascending: true }),
        supabase.from('habits').select('*'),
        supabase.from('goals').select('*'),
        supabase.from('user_settings').select('*').eq('user_id', user.id).single()
      ]);

      setData({
        tasks: tData.data || [],
        attendance: attData.data || [],
        expenses: eData.data || [],
        grades: gData.data || [],
        habits: hData.data || [],
        goals: glData.data || [],
        settings: sData.data || { monthly_budget: 7000, xp_spent: 0 }
      });
      setLoading(false);
    };
    fetchAllData();
  }, [user]);

  // ─── MASSIVE ALGORITHMIC AGGREGATION ───
  const analytics = useMemo(() => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    // 1. PRODUCTIVITY
    const completedTasks = data.tasks.filter(t => t.status === "completed").length;
    const taskRate = data.tasks.length ? (completedTasks / data.tasks.length) * 100 : 0;
    const completedGoals = data.goals.filter(g => g.progress === 100).length;
    const goalRate = data.goals.length ? (completedGoals / data.goals.length) * 100 : 0;
    const productivityScore = Math.min(100, (taskRate * 0.7) + (goalRate * 0.3)) || 0;

    // 2. CONSISTENCY
    const habitsDoneToday = data.habits.filter(h => h.last_completed === todayStr).length;
    const avgStreak = data.habits.length ? data.habits.reduce((acc, h) => acc + h.streak, 0) / data.habits.length : 0;
    const consistencyScore = Math.min(100, (habitsDoneToday / (data.habits.length || 1) * 50) + (avgStreak * 5)) || 0;

    // 3. ACADEMICS
    const GRADE_PTS = { "O":10, "A+":9, "A":8, "B+":7, "B":6, "C":5, "D":4, "F":0 };
    let tCred = 0, tPts = 0;
    data.grades.forEach(g => { tCred += g.credits; tPts += (g.credits * (GRADE_PTS[g.grade] || 0)); });
    const cgpa = tCred ? (tPts / tCred) : 0;
    const academicScore = (cgpa / 10) * 100 || 0;

    // 4. ATTENDANCE
    const tClasses = data.attendance.reduce((acc, c) => acc + c.total, 0);
    const tPresent = data.attendance.reduce((acc, c) => acc + c.present, 0);
    const attendanceScore = tClasses ? (tPresent / tClasses) * 100 : 0;

    // 5. FINANCE
    const monthlyExp = data.expenses.filter(e => new Date(e.date).getMonth() === currentMonth && new Date(e.date).getFullYear() === currentYear);
    const spentThisMonth = monthlyExp.reduce((acc, e) => acc + Number(e.amount), 0);
    const budget = data.settings.monthly_budget || 7000;
    const budgetUsedPct = (spentThisMonth / budget) * 100;
    let financeScore = 100;
    if (budgetUsedPct > 100) financeScore = Math.max(0, 100 - ((budgetUsedPct - 100) * 2));
    else if (budgetUsedPct > 0) financeScore = 100 - (budgetUsedPct * 0.2);

    // MASTER SCORE
    const masterScore = Math.round((productivityScore * 0.2) + (consistencyScore * 0.2) + (academicScore * 0.2) + (attendanceScore * 0.2) + (financeScore * 0.2));

    // ─── NEW: 7-DAY VELOCITY TRACKER ───
    const last7Days = Array.from({length: 7}, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split('T')[0];
    });
    
    const velocityChart = last7Days.map(dateStr => {
      // Find tasks completed on this exact date
      const count = data.tasks.filter(t => t.completed_at && t.completed_at.startsWith(dateStr)).length;
      return { 
        day: new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short' }), 
        count 
      };
    });
    const maxVelocity = Math.max(...velocityChart.map(v => v.count), 1); // Avoid div by 0

    // ─── NEW: SUBJECT MASTERY MATRIX ───
    const subjectMap = {};
    data.tasks.forEach(t => {
      const sub = t.subject || "General";
      if (!subjectMap[sub]) subjectMap[sub] = { total: 0, completed: 0 };
      subjectMap[sub].total += 1;
      if (t.status === "completed") subjectMap[sub].completed += 1;
    });
    // Get top 4 subjects by volume
    const topSubjects = Object.entries(subjectMap)
      .map(([name, stats]) => ({ name, ...stats, pct: Math.round((stats.completed / stats.total) * 100) }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 4);

    // AI ACTION PLAN
    const actionPlan = [];
    const pendingTasks = data.tasks.filter(t => t.status !== "completed");
    if (pendingTasks.length > 0) {
      const urgent = pendingTasks.filter(t => t.priority === "high");
      if (urgent.length > 0) actionPlan.push({ icon: "🔥", text: `You have ${urgent.length} high-priority assignments pending.`, type: "urgent" });
    }
    const atRiskClasses = data.attendance.filter(a => a.total > 0 && (a.present / a.total * 100) < a.required);
    if (atRiskClasses.length > 0) {
      actionPlan.push({ icon: "⚠️", text: `${atRiskClasses.map(c=>c.subject).join(', ')} attendance is below target!`, type: "urgent" });
    }
    if (budgetUsedPct >= 90) {
      actionPlan.push({ icon: "💸", text: `You have used ${Math.round(budgetUsedPct)}% of your monthly budget. Slow down spending.`, type: "warning" });
    }
    const inactiveHabits = data.habits.filter(h => h.last_completed !== todayStr && h.streak > 0);
    if (inactiveHabits.length > 0) {
      actionPlan.push({ icon: "💧", text: `Don't lose your streak! Complete: ${inactiveHabits.map(h=>h.name).join(', ')}.`, type: "info" });
    }
    if (actionPlan.length === 0 && masterScore > 0) {
      actionPlan.push({ icon: "🌟", text: "Everything is perfectly on track. Keep crushing it!", type: "success" });
    }

    return { 
      scores: { Productivity: productivityScore, Consistency: consistencyScore, Academics: academicScore, Attendance: attendanceScore, Finance: financeScore },
      masterScore, cgpa: cgpa.toFixed(2), spentThisMonth, budgetUsedPct, actionPlan, velocityChart, maxVelocity, topSubjects
    };
  }, [data]);

  // Radar Chart Math
  const getRadarPoint = (value, angle, maxRadius = 80, center = 100) => {
    const rad = (angle - 90) * (Math.PI / 180); 
    const r = (Math.max(10, value) / 100) * maxRadius; 
    return `${center + r * Math.cos(rad)},${center + r * Math.sin(rad)}`;
  };
  const radarPoints = [
    getRadarPoint(analytics.scores.Academics, 0), getRadarPoint(analytics.scores.Productivity, 72),
    getRadarPoint(analytics.scores.Consistency, 144), getRadarPoint(analytics.scores.Finance, 216),
    getRadarPoint(analytics.scores.Attendance, 288),
  ].join(" ");

  // Subject Color Mapper
  const getSubjectColor = (subject) => {
    const s = subject.toLowerCase();
    if (s.includes("phys")) return "bg-blue-400";
    if (s.includes("math")) return "bg-red-400";
    if (s.includes("comp") || s.includes("code")) return "bg-emerald-400";
    if (s.includes("eng")) return "bg-amber-400";
    if (s.includes("chem")) return "bg-purple-400";
    return "bg-slate-400"; 
  };

  if (loading) return <div className="flex h-[80vh] items-center justify-center text-white/40"><div className="w-6 h-6 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin mr-3" /> Synthesizing Data...</div>;

  return (
    <div className="flex flex-col gap-6 relative pb-10">
      
      {/* HEADER */}
      <div>
        <h2 className="text-slate-100 font-bold text-[24px] font-['Plus_Jakarta_Sans'] tracking-tight">System Analytics</h2>
        <p className="text-white/40 text-[13px] mt-0.5">Your entire student life, analyzed and synthesized.</p>
      </div>

      {/* ─── ROW 1: MASTER SCORE & RADAR CHART ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* The Master Score */}
        <div className="bg-gradient-to-br from-[#0d0d14] to-[#1a1a2e] border border-indigo-500/20 rounded-3xl p-6 relative overflow-hidden flex flex-col items-center justify-center text-center shadow-2xl">
          <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl -mr-10 -mt-10" />
          <h3 className="text-indigo-300 text-[11px] uppercase tracking-widest font-extrabold mb-4">GradPilot Master Score</h3>
          <div className="relative w-40 h-40 flex items-center justify-center">
            <svg width="100%" height="100%" viewBox="0 0 100 100" className="-rotate-90 drop-shadow-[0_0_20px_rgba(99,102,241,0.4)]">
              <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
              <circle cx="50" cy="50" r="45" fill="none" stroke="url(#scoreGrad)" strokeWidth="6" strokeLinecap="round" strokeDasharray="282.7" strokeDashoffset={282.7 - (analytics.masterScore / 100) * 282.7} className="transition-[stroke-dashoffset] duration-[2s] ease-out" />
              <defs>
                <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#818cf8" /><stop offset="50%" stopColor="#c084fc" /><stop offset="100%" stopColor="#f472b6" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-[54px] font-extrabold text-white font-['Plus_Jakarta_Sans'] leading-none tracking-tighter">{analytics.masterScore}</span>
            </div>
          </div>
          <p className="text-[12px] text-white/50 mt-6 max-w-[200px]">A unified score based on your Academics, Finance, Consistency, and Productivity.</p>
        </div>

        {/* The Performance Pentagon (Custom SVG Radar Chart) */}
        <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col md:flex-row items-center gap-8">
          <div className="relative w-[220px] h-[220px] shrink-0">
            <svg viewBox="0 0 200 200" className="w-full h-full overflow-visible">
              {[20, 40, 60, 80].map(radius => (
                <polygon key={radius} points={[getRadarPoint(radius, 0, 80), getRadarPoint(radius, 72, 80), getRadarPoint(radius, 144, 80), getRadarPoint(radius, 216, 80), getRadarPoint(radius, 288, 80)].join(" ")} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
              ))}
              {[0, 72, 144, 216, 288].map(angle => (
                <line key={angle} x1="100" y1="100" x2={getRadarPoint(100, angle, 80).split(',')[0]} y2={getRadarPoint(100, angle, 80).split(',')[1]} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
              ))}
              <polygon points={radarPoints} fill="rgba(129, 140, 248, 0.3)" stroke="#818cf8" strokeWidth="2" strokeLinejoin="round" className="drop-shadow-[0_0_15px_rgba(129,140,248,0.5)] transition-all duration-1000" />
              {[0, 72, 144, 216, 288].map((angle, i) => {
                const val = Object.values(analytics.scores)[i];
                return <circle key={angle} cx={getRadarPoint(val, angle, 80).split(',')[0]} cy={getRadarPoint(val, angle, 80).split(',')[1]} r="4" fill="#c084fc" />;
              })}
              <text x="100" y="10" fill="#a1a1aa" fontSize="9" fontWeight="bold" textAnchor="middle">ACADEMICS</text>
              <text x="195" y="75" fill="#a1a1aa" fontSize="9" fontWeight="bold" textAnchor="end">PRODUCTIVITY</text>
              <text x="175" y="185" fill="#a1a1aa" fontSize="9" fontWeight="bold" textAnchor="middle">CONSISTENCY</text>
              <text x="25" y="185" fill="#a1a1aa" fontSize="9" fontWeight="bold" textAnchor="middle">FINANCE</text>
              <text x="5" y="75" fill="#a1a1aa" fontSize="9" fontWeight="bold" textAnchor="start">ATTENDANCE</text>
            </svg>
          </div>
          <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Object.entries(analytics.scores).map(([label, score]) => (
              <div key={label} className="bg-[#0d0d14] border border-white/5 rounded-xl p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[11px] uppercase tracking-wider font-bold text-white/50">{label}</span>
                  <span className="text-[13px] font-extrabold text-indigo-400">{Math.round(score)}/100</span>
                </div>
                <ProgressBar value={score} color="#818cf8" height={4} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── ROW 2: NEW VISUALIZATIONS ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* NEW: 7-Day Velocity Chart */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div>
              <div className="text-[11px] text-white/40 uppercase tracking-widest font-bold">Velocity</div>
              <h3 className="text-slate-100 font-semibold text-[16px]">Tasks Completed (Last 7 Days)</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 text-lg">📈</div>
          </div>
          
          <div className="flex-1 flex items-end justify-between gap-2 pt-4 h-[150px]">
            {analytics.velocityChart.map((stat, i) => (
              <div key={i} className="flex flex-col items-center flex-1 gap-2 group">
                {/* Tooltip on hover */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold text-indigo-300 absolute -mt-6">
                  {stat.count}
                </div>
                {/* The Bar */}
                <div className="w-full max-w-[32px] bg-white/5 rounded-t-md relative flex items-end overflow-hidden h-[120px]">
                  <div 
                    className="w-full bg-gradient-to-t from-indigo-600 to-purple-400 rounded-t-md transition-all duration-1000 ease-out"
                    style={{ height: `${(stat.count / analytics.maxVelocity) * 100}%`, minHeight: stat.count > 0 ? '4px' : '0' }}
                  />
                </div>
                {/* Day Label */}
                <span className={`text-[10px] font-bold uppercase ${i === 6 ? 'text-indigo-400' : 'text-white/40'}`}>{stat.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* NEW: Subject Mastery Matrix */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div>
              <div className="text-[11px] text-white/40 uppercase tracking-widest font-bold">Focus Areas</div>
              <h3 className="text-slate-100 font-semibold text-[16px]">Subject Completion Matrix</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 text-lg">🎯</div>
          </div>

          <div className="flex flex-col gap-4 flex-1 justify-center">
            {analytics.topSubjects.length === 0 ? (
              <div className="text-center text-white/30 text-sm py-4">Assign subjects to tasks to see your matrix!</div>
            ) : (
              analytics.topSubjects.map(sub => (
                <div key={sub.name} className="flex items-center gap-4">
                  <div className="w-24 shrink-0 text-[12px] font-bold text-slate-200 truncate" title={sub.name}>{sub.name}</div>
                  <div className="flex-1 h-3 bg-black/20 rounded-full overflow-hidden flex">
                    <div 
                      className={`h-full transition-all duration-1000 ${getSubjectColor(sub.name)}`}
                      style={{ width: `${sub.pct}%` }} 
                    />
                  </div>
                  <div className="w-12 shrink-0 text-right">
                    <span className="text-[12px] font-extrabold text-white/60">{sub.completed}</span>
                    <span className="text-[10px] text-white/30">/{sub.total}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ─── ROW 3: AI ACTION PLAN ─── */}
      <div className="bg-white/5 border border-white/10 rounded-3xl p-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-indigo-500 to-purple-500" />
        <div className="flex items-center gap-3 mb-5 pl-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-300">
            <Icon d={Icons.zap} size={16} />
          </div>
          <h3 className="text-slate-100 font-semibold text-[16px]">Today's Action Plan</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-2">
          {analytics.actionPlan.map((action, i) => {
            const styles = {
              urgent: "border-red-500/30 bg-red-500/5 text-red-200",
              warning: "border-amber-500/30 bg-amber-500/5 text-amber-200",
              info: "border-indigo-500/30 bg-indigo-500/5 text-indigo-200",
              success: "border-green-500/30 bg-green-500/5 text-green-200"
            };
            return (
              <div key={i} className={`p-4 rounded-2xl border ${styles[action.type]} flex gap-3 items-start shadow-sm`}>
                <div className="text-xl mt-0.5 drop-shadow-md">{action.icon}</div>
                <div className="text-[13px] font-medium leading-relaxed">{action.text}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── ROW 4: ACADEMICS & FINANCE SUMMARY ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col justify-between hover:bg-white/[0.07] transition-colors">
          <div>
            <div className="text-[11px] text-white/40 uppercase tracking-widest font-bold mb-1">Cumulative GPA</div>
            <div className="text-[36px] font-extrabold text-slate-100 font-['Plus_Jakarta_Sans'] leading-none tracking-tight">{analytics.cgpa}</div>
          </div>
          <div className="mt-6">
            <div className="text-[12px] text-white/60 mb-2 font-medium">Recorded Courses: {data.grades.length}</div>
            <ProgressBar value={(analytics.cgpa / 10) * 100} color="#a855f7" height={6} />
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col justify-between hover:bg-white/[0.07] transition-colors">
          <div>
            <div className="text-[11px] text-white/40 uppercase tracking-widest font-bold mb-1">Monthly Spend</div>
            <div className="text-[36px] font-extrabold text-slate-100 font-['Plus_Jakarta_Sans'] leading-none tracking-tight">₹{analytics.spentThisMonth.toLocaleString()}</div>
          </div>
          <div className="mt-6">
            <div className="flex justify-between text-[12px] text-white/60 mb-2 font-medium">
              <span>{Math.round(analytics.budgetUsedPct)}% used</span>
              <span>Limit: ₹{data.settings.monthly_budget}</span>
            </div>
            <ProgressBar value={analytics.budgetUsedPct} color={analytics.budgetUsedPct > 100 ? "#f87171" : "#fb923c"} height={6} />
          </div>
        </div>
      </div>

    </div>
  );
}