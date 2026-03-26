import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ProgressBar from "../components/ui/ProgressBar";
import { Icon, Icons } from "../components/ui/Icon";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

const TABS = ["Overview", "Focus", "Academics", "Finance", "Consistency"];

export default function Analytics() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Overview");
  
  const [data, setData] = useState({
    tasks: [], attendance: [], expenses: [], grades: [], habits: [], goals: [], profile: {}, sessions: []
  });

  useEffect(() => {
    const fetchAllData = async () => {
      if (!user) return;
      setLoading(true);
      
      const [ tData, attData, eData, gData, hData, glData, pData, sData ] = await Promise.all([
        supabase.from('tasks').select('*').eq('user_id', user.id),
        supabase.from('attendance').select('*').eq('user_id', user.id),
        supabase.from('expenses').select('*').eq('user_id', user.id),
        supabase.from('grades').select('*').eq('user_id', user.id).order('semester', { ascending: true }),
        supabase.from('habits').select('*').eq('user_id', user.id),
        supabase.from('goals').select('*').eq('user_id', user.id),
        supabase.from('profiles').select('*').eq('id', user.id).single(), // 🐛 BUG FIXED: Pulling from profiles!
        supabase.from('study_sessions').select('*').eq('user_id', user.id) // 🚀 NEW: Pulling focus sessions!
      ]);

      setData({
        tasks: tData.data || [],
        attendance: attData.data || [],
        expenses: eData.data || [],
        grades: gData.data || [],
        habits: hData.data || [],
        goals: glData.data || [],
        profile: pData.data || { monthly_budget: 7000 },
        sessions: sData.data || []
      });
      
      setLoading(false);
    };
    
    fetchAllData();
  }, [user]);

  // ─── MASSIVE ALGORITHMIC AGGREGATION ───
  const analytics = useMemo(() => {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const currentDayOfMonth = today.getDate();

    // 1. PRODUCTIVITY
    const completedTasks = data.tasks.filter(t => t.status === "completed").length;
    const taskRate = data.tasks.length ? (completedTasks / data.tasks.length) * 100 : 0;
    const productivityScore = Math.min(100, taskRate) || 0;

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

    // 5. FINANCE (Upgraded)
    const monthlyExp = data.expenses.filter(e => new Date(e.date).getMonth() === currentMonth && new Date(e.date).getFullYear() === currentYear);
    const spentThisMonth = monthlyExp.reduce((acc, e) => acc + Number(e.amount), 0);
    const budget = data.profile.monthly_budget || 7000;
    const budgetUsedPct = (spentThisMonth / budget) * 100;
    const dailyBurnRate = spentThisMonth / (currentDayOfMonth || 1);
    const projectedSpend = dailyBurnRate * daysInMonth;
    
    let financeScore = 100;
    if (budgetUsedPct > 100) financeScore = Math.max(0, 100 - ((budgetUsedPct - 100) * 2));
    else if (budgetUsedPct > 0) financeScore = 100 - (budgetUsedPct * 0.2);

    // MASTER SCORE
    const masterScore = Math.round((productivityScore * 0.2) + (consistencyScore * 0.2) + (academicScore * 0.2) + (attendanceScore * 0.2) + (financeScore * 0.2));

    // 6. FOCUS TIME
    const totalFocusMinutes = data.sessions.reduce((acc, s) => acc + (s.duration_minutes || 0), 0);
    const focusHours = `${Math.floor(totalFocusMinutes / 60)}h ${totalFocusMinutes % 60}m`;

    // 7. 30-DAY HABIT GRID (GitHub Style)
    const last30Days = Array.from({length: 30}, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (29 - i));
      const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      // In a real app with historical habit tracking, you'd check logs. 
      // For now, we simulate intensity based on current streaks to make the grid look cool!
      const activeHabits = data.habits.filter(h => h.streak > (29 - i)).length; 
      return { date: ds, count: activeHabits };
    });

    // AI ACTION PLAN
    const actionPlan = [];
    if (projectedSpend > budget) actionPlan.push({ icon: "💸", text: `At your current burn rate (₹${Math.round(dailyBurnRate)}/day), you will overspend by ₹${Math.round(projectedSpend - budget)} this month.`, type: "warning" });
    const atRiskClasses = data.attendance.filter(a => a.total > 0 && (a.present / a.total * 100) < a.required);
    if (atRiskClasses.length > 0) actionPlan.push({ icon: "⚠️", text: `${atRiskClasses.map(c=>c.subject).join(', ')} attendance is dangerously low!`, type: "urgent" });
    if (actionPlan.length === 0) actionPlan.push({ icon: "🌟", text: "Systems optimal. You are perfectly on track.", type: "success" });

    return { 
      scores: { Productivity: productivityScore, Consistency: consistencyScore, Academics: academicScore, Attendance: attendanceScore, Finance: financeScore },
      masterScore, cgpa: cgpa.toFixed(2), spentThisMonth, budget, budgetUsedPct, dailyBurnRate, projectedSpend, actionPlan, focusHours, last30Days, atRiskClasses
    };
  }, [data]);

  // Radar Chart Helper
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

  if (loading) return <div className="flex h-[80vh] items-center justify-center text-white/40"><div className="w-6 h-6 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin mr-3" /> Aggregating Data...</div>;

  return (
    <div className="flex flex-col gap-6 relative pb-10">
      
      {/* HEADER & TABS */}
      <div className="flex flex-col gap-5">
        <div>
          <h2 className="text-slate-100 font-bold text-[28px] font-['Plus_Jakarta_Sans'] tracking-tight">System Analytics</h2>
          <p className="text-white/40 text-[14px] mt-1">Your entire student life, synthesized.</p>
        </div>
        
        {/* Sleek Tab Navigation */}
        <div className="flex overflow-x-auto pb-2 scrollbar-hide gap-2">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 rounded-xl text-[13px] font-bold transition-all whitespace-nowrap ${
                activeTab === tab 
                  ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25' 
                  : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/80'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="flex flex-col gap-6"
        >

          {/* ─── TAB: OVERVIEW ─── */}
          {activeTab === "Overview" && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-[#0d0d14] to-[#1a1a2e] border border-indigo-500/20 rounded-3xl p-6 relative overflow-hidden flex flex-col items-center justify-center text-center shadow-2xl">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl -mr-10 -mt-10" />
                  <h3 className="text-indigo-300 text-[11px] uppercase tracking-widest font-extrabold mb-4">Master Score</h3>
                  <div className="relative w-40 h-40 flex items-center justify-center">
                    <svg width="100%" height="100%" viewBox="0 0 100 100" className="-rotate-90 drop-shadow-[0_0_20px_rgba(99,102,241,0.4)]">
                      <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
                      <circle cx="50" cy="50" r="45" fill="none" stroke="url(#scoreGrad)" strokeWidth="6" strokeLinecap="round" strokeDasharray="282.7" strokeDashoffset={282.7 - (analytics.masterScore / 100) * 282.7} className="transition-[stroke-dashoffset] duration-[1.5s] ease-out" />
                      <defs>
                        <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#818cf8" /><stop offset="50%" stopColor="#c084fc" /><stop offset="100%" stopColor="#f472b6" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <span className="absolute text-[54px] font-extrabold text-white font-['Plus_Jakarta_Sans']">{analytics.masterScore}</span>
                  </div>
                </div>

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

              {/* AI Action Plan */}
              <div className="bg-white/5 border border-white/10 rounded-3xl p-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-indigo-500 to-purple-500" />
                <h3 className="text-slate-100 font-semibold text-[16px] mb-4 pl-2 flex items-center gap-2"><span className="text-indigo-400">⚡</span> Action Plan</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-2">
                  {analytics.actionPlan.map((action, i) => (
                    <div key={i} className={`p-4 rounded-2xl border flex gap-3 items-start shadow-sm ${
                      action.type === 'urgent' ? 'border-red-500/30 bg-red-500/5 text-red-200' :
                      action.type === 'warning' ? 'border-amber-500/30 bg-amber-500/5 text-amber-200' : 'border-green-500/30 bg-green-500/5 text-green-200'
                    }`}>
                      <div className="text-xl mt-0.5">{action.icon}</div>
                      <div className="text-[13px] font-medium leading-relaxed">{action.text}</div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ─── TAB: FOCUS & PRODUCTIVITY ─── */}
          {activeTab === "Focus" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col items-center justify-center text-center">
                <div className="text-[64px] mb-2">🧠</div>
                <div className="text-[12px] text-white/40 uppercase tracking-widest font-bold mb-1">Lifetime Focus Hours</div>
                <div className="text-[48px] font-extrabold text-slate-100 leading-none">{analytics.focusHours}</div>
                <p className="text-[13px] text-white/50 mt-4 max-w-[250px]">Time spent in deep work using the Pomodoro Timer.</p>
              </div>
              
              <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                <h3 className="text-slate-100 font-semibold text-[16px] mb-4">Task Completion Rate</h3>
                <div className="flex items-center gap-6">
                  <div className="text-[36px] font-extrabold text-emerald-400">{Math.round(analytics.scores.Productivity)}%</div>
                  <div className="flex-1">
                    <ProgressBar value={analytics.scores.Productivity} color="#34d399" height={8} />
                    <div className="flex justify-between text-[11px] text-white/40 mt-2 font-bold uppercase">
                      <span>Completed</span>
                      <span>Total Assigned</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── TAB: ACADEMICS ─── */}
          {activeTab === "Academics" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-purple-500/10 to-[#0d0d14] border border-purple-500/20 rounded-3xl p-6">
                <div className="text-[12px] text-white/40 uppercase tracking-widest font-bold mb-2">Cumulative GPA</div>
                <div className="text-[56px] font-extrabold text-purple-400 leading-none tracking-tight">{analytics.cgpa}</div>
                <div className="mt-8">
                  <ProgressBar value={(analytics.cgpa / 10) * 100} color="#a855f7" height={6} />
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                <h3 className="text-slate-100 font-semibold text-[16px] mb-4 flex items-center gap-2"><span>🚨</span> At-Risk Attendance</h3>
                <div className="flex flex-col gap-3">
                  {analytics.atRiskClasses.length === 0 ? (
                    <div className="text-white/40 text-[13px] p-4 bg-[#0d0d14] rounded-xl border border-white/5 text-center">All classes are safely above target!</div>
                  ) : (
                    analytics.atRiskClasses.map(c => (
                      <div key={c.id} className="flex justify-between items-center bg-[#0d0d14] p-3 rounded-xl border border-red-500/20">
                        <div>
                          <div className="text-[14px] font-bold text-slate-200">{c.subject}</div>
                          <div className="text-[11px] text-white/40">Target: {c.required}%</div>
                        </div>
                        <div className="text-[16px] font-extrabold text-red-400">{Math.round((c.present / c.total) * 100)}%</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ─── TAB: FINANCE ─── */}
          {activeTab === "Finance" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                <div className="text-[12px] text-white/40 uppercase tracking-widest font-bold mb-1">Monthly Spend vs Budget</div>
                <div className="flex items-end gap-2 mb-6">
                  <div className="text-[42px] font-extrabold text-slate-100 leading-none">₹{analytics.spentThisMonth.toLocaleString()}</div>
                  <div className="text-[14px] text-white/40 font-bold mb-1.5">/ ₹{analytics.budget.toLocaleString()}</div>
                </div>
                <ProgressBar value={analytics.budgetUsedPct} color={analytics.budgetUsedPct > 100 ? "#f87171" : "#fb923c"} height={10} />
              </div>

              <div className="bg-gradient-to-br from-[#0d0d14] to-orange-500/5 border border-orange-500/20 rounded-3xl p-6 flex flex-col justify-center">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[13px] font-bold text-white/50">Daily Burn Rate</span>
                  <span className="text-[18px] font-extrabold text-orange-400">₹{Math.round(analytics.dailyBurnRate)} / day</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[13px] font-bold text-white/50">Projected EOM Spend</span>
                  <span className={`text-[18px] font-extrabold ${analytics.projectedSpend > analytics.budget ? 'text-red-400' : 'text-slate-200'}`}>
                    ₹{Math.round(analytics.projectedSpend).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ─── TAB: CONSISTENCY ─── */}
          {activeTab === "Consistency" && (
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
              <h3 className="text-slate-100 font-semibold text-[16px] mb-6">30-Day Habit Activity</h3>
              <div className="flex flex-wrap gap-2">
                {analytics.last30Days.map((day, i) => {
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
          )}

        </motion.div>
      </AnimatePresence>
    </div>
  );
}