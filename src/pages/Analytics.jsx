import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ProgressBar from "../components/ui/ProgressBar";
import { Icon, Icons } from "../components/ui/Icon";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import RadarChart from "../components/analytics/RadarChart";
import HabitHeatmap from "../components/analytics/HabitHeatmap";
import WeightsModal from "../components/analytics/WeightsModal"; 
import AIDecisionEngine from "../components/analytics/AIDecisionEngine"; 
import DrillDownModal from "../components/analytics/DrillDownModal";

const TABS = ["Overview", "Focus", "Academics", "Finance", "Consistency"];

export default function Analytics() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Overview");
  const [isWeightsModalOpen, setIsWeightsModalOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [hasNotified, setHasNotified] = useState(false);
  const [weights, setWeights] = useState({ Productivity: 20, Consistency: 20, Academics: 20, Attendance: 20, Finance: 20 });
  const [drillDownCategory, setDrillDownCategory] = useState(null);
  
  const [data, setData] = useState({
    tasks: [], attendance: [], expenses: [], grades: [], habits: [], goals: [], profile: {}, sessions: []
  });

  useEffect(() => {
      document.title = "Analytics | GradPilot";
    }, []);

  // ─── 🛡️ STRICT DATA FETCHING (Bugs 1 & 2 Fixed) ───
  useEffect(() => {
    const fetchAllData = async () => {
      if (!user?.id) return; // CRITICAL: Null guard
      setLoading(true);
      
      try {
        const [ tRes, attRes, eRes, gRes, hRes, glRes, pRes, sRes ] = await Promise.all([
          supabase.from('tasks').select('*').eq('user_id', user.id),
          supabase.from('attendance').select('*').eq('user_id', user.id),
          supabase.from('expenses').select('*').eq('user_id', user.id),
          supabase.from('grades').select('*').eq('user_id', user.id).order('semester', { ascending: true }),
          supabase.from('habits').select('*').eq('user_id', user.id),
          supabase.from('goals').select('*').eq('user_id', user.id),
          supabase.from('profiles').select('*').eq('id', user.id).single(),
          supabase.from('study_sessions').select('*').eq('user_id', user.id) 
        ]);

        // Strict error checking across all tables
        if (tRes.error) throw tRes.error;
        if (pRes.error) throw pRes.error;

        setData({
          tasks: tRes.data || [],
          attendance: attRes.data || [],
          expenses: eRes.data || [],
          grades: gRes.data || [],
          habits: hRes.data || [],
          goals: glRes.data || [],
          profile: pRes.data || { monthly_budget: 7000 },
          sessions: sRes.data || []
        });
      } catch (error) {
        console.error("Critical Analytics Fetch Error:", error);
        // Fallback state if database fails
      } finally {
        setLoading(false);
      }
    };
    
    fetchAllData();
  }, [user]);

  // ─── 🧮 OPTIMIZED ALGORITHMIC AGGREGATION (Bugs 3 & 5 Fixed) ───
  const analytics = useMemo(() => {
    // Return early if data isn't loaded to prevent expensive math on empty arrays
    if (!data.profile.id && data.tasks.length === 0 && data.habits.length === 0) return null;

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const currentDayOfMonth = Math.max(1, today.getDate()); // Prevent division by zero

    // 1. PRODUCTIVITY
    const completedTasks = data.tasks.filter(t => t.status === "completed").length;
    const productivityScore = data.tasks.length ? Math.min(100, (completedTasks / data.tasks.length) * 100) : 0;

    // 2. CONSISTENCY
    const habitsDoneToday = data.habits.filter(h => h.last_completed === todayStr).length;
    const avgStreak = data.habits.length ? data.habits.reduce((acc, h) => acc + h.streak, 0) / data.habits.length : 0;
    const consistencyScore = Math.min(100, (habitsDoneToday / Math.max(1, data.habits.length) * 50) + (avgStreak * 5));

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

    // 5. FINANCE (🛡️ Bug 5 Fixed: Division Safety)
    const monthlyExp = data.expenses.filter(e => new Date(e.date).getMonth() === currentMonth && new Date(e.date).getFullYear() === currentYear);
    const spentThisMonth = monthlyExp.reduce((acc, e) => acc + Number(e.amount), 0);
    const budget = Math.max(1, data.profile.monthly_budget || 7000); // NEVER let budget be 0
    const budgetUsedPct = (spentThisMonth / budget) * 100;
    const dailyBurnRate = spentThisMonth / currentDayOfMonth;
    const projectedSpend = dailyBurnRate * daysInMonth;
    
    let financeScore = 100;
    if (budgetUsedPct > 100) financeScore = Math.max(0, 100 - ((budgetUsedPct - 100) * 2));
    else if (budgetUsedPct > 0) financeScore = 100 - (budgetUsedPct * 0.2);

  // MASTER SCORE (🛡️ Dynamic Weights Upgrade)
    const totalWeight = Object.values(weights).reduce((acc, val) => acc + val, 0) || 1;
    const masterScore = Math.round(
      ((productivityScore * weights.Productivity) +
       (consistencyScore * weights.Consistency) +
       (academicScore * weights.Academics) +
       (attendanceScore * weights.Attendance) +
       (financeScore * weights.Finance)) / totalWeight
    );

    // 6. FOCUS TIME
    const totalFocusMinutes = data.sessions.reduce((acc, s) => acc + (s.duration_minutes || 0), 0);
    const focusHours = `${Math.floor(totalFocusMinutes / 60)}h ${totalFocusMinutes % 60}m`;

    // 7. HABIT HEATMAP & 30-DAY GRID
    const activeHabitsCount = data.habits.filter(h => h.streak > 0).length;
    
    // 🐛 FIX: Restored the missing last30Days math!
    const last30Days = Array.from({length: 30}, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (29 - i));
      const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const activeHabits = data.habits.filter(h => h.streak > (29 - i)).length; 
      return { date: ds, count: activeHabits };
    });

    // We keep atRiskClasses because the Academics Tab still needs it!
    const atRiskClasses = data.attendance.filter(a => a.total > 0 && (a.present / a.total * 100) < a.required);

    // 8. TREND MATH (This Week vs Last Week)
    const oneWeekAgo = new Date(); oneWeekAgo.setDate(today.getDate() - 7);
    const twoWeeksAgo = new Date(); twoWeeksAgo.setDate(today.getDate() - 14);

    // Productivity Trend
    const tasksThisWk = data.tasks.filter(t => new Date(t.created_at) >= oneWeekAgo).length;
    const tasksLastWk = data.tasks.filter(t => new Date(t.created_at) >= twoWeeksAgo && new Date(t.created_at) < oneWeekAgo).length;
    const prodTrend = tasksLastWk ? Math.round(((tasksThisWk - tasksLastWk) / tasksLastWk) * 100) : 0;

    // Consistency Trend (Focus Sessions)
    const focusThisWk = data.sessions.filter(s => new Date(s.created_at) >= oneWeekAgo).length;
    const focusLastWk = data.sessions.filter(s => new Date(s.created_at) >= twoWeeksAgo && new Date(s.created_at) < oneWeekAgo).length;
    const consTrend = focusLastWk ? Math.round(((focusThisWk - focusLastWk) / focusLastWk) * 100) : 0;

    const trends = { Productivity: prodTrend, Consistency: consTrend, Academics: 0, Attendance: 0, Finance: 0 };

    // 9. 🔮 PREDICTIVE ANALYTICS (Future CGPA Modeling)
    // Assuming a standard 4-year degree has ~120 credits. 
    const totalDegreeCredits = 120; 
    const creditsRemaining = Math.max(0, totalDegreeCredits - tCred);
    
    // We predict their future grades based on their current Master Score (e.g., 85 Score = 8.5 GPA trajectory)
    const predictedFutureTrajectory = Math.max(4, masterScore / 10); 
    const predictedCGPA = tCred > 0 ? ((tPts + (creditsRemaining * predictedFutureTrajectory)) / totalDegreeCredits).toFixed(2) : 0;
    
    // If they get perfect 10/10s for the rest of their degree
    const maxPossibleCGPA = tCred > 0 ? ((tPts + (creditsRemaining * 10)) / totalDegreeCredits).toFixed(2) : 0;

    return { 
      scores: { Productivity: productivityScore, Consistency: consistencyScore, Academics: academicScore, Attendance: attendanceScore, Finance: financeScore },
      masterScore, cgpa: cgpa.toFixed(2), spentThisMonth, budget, budgetUsedPct, dailyBurnRate, projectedSpend, focusHours, atRiskClasses, activeHabitsCount, last30Days, trends, predictedCGPA, maxPossibleCGPA
    };
  }, [data, weights]);

  // ─── 🚨 AUTOMATED SMART NOTIFICATIONS (Feature #8) ───
  useEffect(() => {
    if (!analytics || hasNotified) return;

    let alertMsg = null;
    
    // The engine checks for critical failures in order of priority
    if (analytics.atRiskClasses.length > 0) {
      alertMsg = `🚨 Warning: ${analytics.atRiskClasses.length} class(es) have critically low attendance!`;
    } else if (analytics.projectedSpend > analytics.budget) {
      alertMsg = "💸 Alert: You are mathematically projected to overspend your budget this month!";
    } else if (analytics.trends.Productivity <= -20) {
      alertMsg = "⚠️ Productivity dropped by 20%+ this week. Let's refocus today.";
    }

    if (alertMsg) {
      setToast(alertMsg);
      setHasNotified(true); // Ensures it only fires once per session so we don't spam them
      setTimeout(() => setToast(null), 6000);
    }
  }, [analytics, hasNotified]);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center text-white/40">
        <div className="w-6 h-6 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin mr-3" /> 
        Aggregating Data...
      </div>
    );
  }

  // 🛡️ Extra Safety: Don't render the dashboard until the math is finished
  if (!analytics) return null;

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
                {/* Master Score Box */}
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
                  <button onClick={() => setIsWeightsModalOpen(true)} className="mt-6 px-4 py-1.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 text-[10px] font-bold uppercase tracking-widest hover:bg-indigo-500/20 transition-colors z-10">
                    ⚙️ Configure Weights
                  </button>
                </div>

                {/* 🕸️ MODULAR RADAR CHART (Now Clickable with Trends) */}
                <RadarChart 
                  scores={analytics.scores} 
                  trends={analytics.trends} 
                  onCardClick={(category) => setDrillDownCategory(category)} 
                />
              </div>

              {/* 🧠 MODULAR AI DECISION ENGINE */}
              <AIDecisionEngine analyticsData={analytics} />
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

              {/* 🔮 NEW: PREDICTIVE CGPA MODELING */}
              <div className="md:col-span-2 bg-gradient-to-r from-blue-900/20 to-indigo-900/20 border border-blue-500/30 rounded-3xl p-6 relative overflow-hidden mt-2">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-[50px] rounded-full pointer-events-none" />
                <h3 className="text-slate-100 font-semibold text-[16px] mb-5 flex items-center gap-2 relative z-10">
                  <span className="text-xl">🔮</span> Predictive CGPA Modeling
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
                  <div className="bg-[#0d0d14]/50 border border-white/5 rounded-2xl p-4">
                    <div className="text-[11px] text-white/40 uppercase font-bold mb-1">Current Standing</div>
                    <div className="text-3xl font-extrabold text-slate-200">{analytics.cgpa}</div>
                  </div>
                  
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-4 shadow-[0_0_15px_rgba(59,130,246,0.1)]">
                    <div className="text-[11px] text-blue-300/70 uppercase font-bold mb-1">Predicted Final CGPA</div>
                    <div className="text-3xl font-extrabold text-blue-400">{analytics.predictedCGPA}</div>
                    <p className="text-[10px] text-blue-300/50 mt-1 leading-tight">If you maintain your current Master Score trajectory.</p>
                  </div>
                  
                  <div className="bg-purple-500/10 border border-purple-500/30 rounded-2xl p-4 shadow-[0_0_15px_rgba(168,85,247,0.1)]">
                    <div className="text-[11px] text-purple-300/70 uppercase font-bold mb-1">Maximum Possible</div>
                    <div className="text-3xl font-extrabold text-purple-400">{analytics.maxPossibleCGPA}</div>
                    <p className="text-[10px] text-purple-300/50 mt-1 leading-tight">If you score perfect 'O's for all remaining credits.</p>
                  </div>
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
            <HabitHeatmap last30Days={analytics.last30Days} />
          )}

        </motion.div>
      </AnimatePresence>
      {/* ⚖️ WEIGHTS CONFIGURATION MODAL */}
      <WeightsModal 
        isOpen={isWeightsModalOpen} 
        onClose={() => setIsWeightsModalOpen(false)} 
        weights={weights} 
        setWeights={setWeights} 
      />

      {/* 🔍 DRILL DOWN MODAL */}
      <DrillDownModal 
        isOpen={!!drillDownCategory} 
        onClose={() => setDrillDownCategory(null)} 
        category={drillDownCategory} 
        data={data} 
      />

      {/* 🚨 GLOBAL NOTIFICATION TOAST */}
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] bg-[#0d0d14] border border-white/20 text-slate-200 px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-[slideDown_0.4s_ease-out]">
          <span className="text-[14px] font-bold tracking-wide">{toast}</span>
        </div>
      )}

    </div>
  );
}