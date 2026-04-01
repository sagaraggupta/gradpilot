import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Icon, Icons } from "../components/ui/Icon";
import ProgressBar from "../components/ui/ProgressBar";
import Badge from "../components/ui/Badge";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { generateFCMToken } from '../lib/firebase';
import AIInsightsWidget from '../components/dashboard/AIInsightsWidget';
import AIDailyCommander from '../components/dashboard/AIDailyCommander';
import StartMyDayModal from '../components/dashboard/StartMyDayModal';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // 🆕 New Error State

  // ─── DECOUPLED STATE (Fixing the Monolithic State) ───
  const [tasks, setTasks] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [habits, setHabits] = useState([]);
  const [settings, setSettings] = useState({ monthly_budget: 7000 });
  const [isPlannerOpen, setIsPlannerOpen] = useState(false);

// ─── 🛡️ BULLETPROOF LOCAL DATE MATH (Bug 4 Fixed) ───
  // We wrap this in useMemo so 'today' doesn't recreate on every single React render!
  const { today, todayStr, currentDayName, yesterdayStr } = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    
    const yd = new Date(d);
    yd.setDate(yd.getDate() - 1);
    const yy = yd.getFullYear();
    const ym = String(yd.getMonth() + 1).padStart(2, '0');
    const yday = String(yd.getDate()).padStart(2, '0');

    return {
      today: d, // 👈 FIX: We now export the actual 'today' object!
      todayStr: `${y}-${m}-${day}`,
      currentDayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
      yesterdayStr: `${yy}-${ym}-${yday}`
    };
  }, []); // Empty dependency array = only runs once when component mounts!

  useEffect(() => {
    document.title = "Dashboard | GradPilot";
  }, []);

  // ─── 🛡️ STRICT FETCH ALL DATA (Bugs 1 & 5 Fixed) ───
  useEffect(() => {
    let isMounted = true; // Prevents memory leaks if they navigate away during fetch

    const fetchDashboardData = async () => {
      if (!user?.id) return; // CRITICAL: Strict null guard
      
      setLoading(true);
      setError(null);
      
      try {
        const { data: profile, error: profileErr } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(); 
        
        if (profileErr) throw profileErr;

        if (!profile || !profile.full_name) {
          if (isMounted) navigate('/onboarding');
          return; 
        }

        const [ tRes, attRes, eRes, hRes ] = await Promise.all([
          supabase.from('tasks').select('*').eq('user_id', user.id).order('due', { ascending: true }),
          supabase.from('attendance').select('*').eq('user_id', user.id),
          supabase.from('expenses').select('*').eq('user_id', user.id),
          supabase.from('habits').select('*').eq('user_id', user.id).order('created_at', { ascending: true })
        ]);

        if (isMounted) {
          setTasks(tRes.data || []);
          setAttendance(attRes.data || []);
          setExpenses(eRes.data || []);
          setHabits(hRes.data || []);
          setSettings(profile || { monthly_budget: 7000 }); 
        }
      } catch (err) {
        console.error("Dashboard fetch failed:", err);
        if (isMounted) setError("Failed to load your dashboard data. Please try refreshing.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchDashboardData();
    return () => { isMounted = false; }; // Cleanup function
  }, [user?.id, navigate]);

  // ─── 🛡️ QUICK ACTIONS WITH ROLLBACKS (Bugs 2 & 3 Fixed) ───
  const toggleHabit = async (habit) => {
    const isDoneToday = habit.last_completed === todayStr;
    const newStreak = isDoneToday ? Math.max(0, habit.streak - 1) : ((habit.last_completed === yesterdayStr) ? habit.streak + 1 : 1);
    const newLastCompleted = isDoneToday ? (newStreak > 0 ? yesterdayStr : null) : todayStr;

    // 1. Optimistic UI Update
    const previousHabits = [...habits];
    setHabits(prev => prev.map(h => h.id === habit.id ? { ...h, streak: newStreak, last_completed: newLastCompleted } : h));
    
    // 2. Database Update
    const { error } = await supabase.from('habits').update({ streak: newStreak, last_completed: newLastCompleted }).eq('id', habit.id).eq('user_id', user.id);
    
    // 3. Rollback on failure
    if (error) {
      console.error("Failed to toggle habit:", error);
      setHabits(previousHabits);
      alert("Failed to update habit. Please check your connection.");
    }
  };

  const markTaskDone = async (id) => {
    // 1. Optimistic UI Update
    const previousTasks = [...tasks];
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: "completed", progress: 100 } : t));
    
    // 2. Database Update
    const { error } = await supabase.from('tasks').update({ status: "completed", progress: 100 }).eq('id', id).eq('user_id', user.id);

    // 3. Rollback on failure
    if (error) {
      console.error("Failed to complete task:", error);
      setTasks(previousTasks);
      alert("Failed to complete task. Please check your connection.");
      return;
    }

    // 🚀 AUTO-VERIFY QUEST
    const { data: activeQuest } = await supabase.from('daily_quests')
      .select('*').eq('user_id', user.id).eq('assigned_date', todayStr)
      .eq('title', 'Organize your upcoming assignments').eq('is_completed', false).maybeSingle();

    if (activeQuest) {
      await supabase.from('daily_quests').update({ is_completed: true }).eq('id', activeQuest.id);
    }
  };

  // ─── 🧠 DYNAMIC CALCULATIONS & SMART PRIORITY ENGINE (Feature #3) ───
  const dashboardStats = useMemo(() => {
    const hour = today.getHours();
    const greeting = hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening";

    const classesToday = attendance.filter(c => c.days && c.days.includes(currentDayName));
    
    // 🚀 THE SMART PRIORITY ENGINE
    const pendingTasks = tasks.filter(t => t.status !== "completed");
    const urgentTasks = pendingTasks.map(task => {
      let score = 0;
      
      // 1. Base Priority Weight
      if (task.priority === 'High') score += 20;
      if (task.priority === 'Medium') score += 10;
      
      // 2. Deadline Weight (The closer it is, the higher the score)
      const dueDate = new Date(task.due);
      const diffTime = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
      
      if (diffTime < 0) score += 100;      // 🚨 OVERDUE: Maximum Priority
      else if (diffTime === 0) score += 50; // ⚠️ DUE TODAY: Critical
      else if (diffTime <= 2) score += 30;  // 🟡 DUE SOON: Elevated
      
      return { ...task, urgencyScore: score };
    })
    .sort((a, b) => b.urgencyScore - a.urgencyScore) // Sort by true urgency
    .slice(0, 4); // Take top 4

    const habitsLeft = habits.filter(h => h.last_completed !== todayStr).length;

    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const monthlyExpenses = expenses.filter(e => new Date(e.date).getMonth() === currentMonth && new Date(e.date).getFullYear() === currentYear);
    const spentThisMonth = monthlyExpenses.reduce((acc, e) => acc + Number(e.amount), 0);
    // 🐛 FIX: Parse the date object safely so timestamps don't break the filter
    const spentToday = expenses.filter(e => {
      if (!e.date) return false;
      const expDate = new Date(e.date);
      return expDate.getDate() === today.getDate() && 
             expDate.getMonth() === today.getMonth() && 
             expDate.getFullYear() === today.getFullYear();
    }).reduce((acc, e) => acc + Number(e.amount), 0);
    const budgetRemaining = Math.max(0, (settings.monthly_budget || 7000) - spentThisMonth);

    return { greeting, classesToday, pendingTasks, urgentTasks, habitsLeft, spentToday, budgetRemaining };
  }, [tasks, attendance, expenses, habits, settings, todayStr, currentDayName, today]);

  // ─── ERROR & LOADING STATES ───
  if (error) {
    return (
      <div className="flex flex-col h-[80vh] items-center justify-center text-center gap-4">
        <div className="text-5xl">⚠️</div>
        <p className="text-red-400 font-bold text-lg">{error}</p>
        <button onClick={() => window.location.reload()} className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors">Reload Page</button>
      </div>
    );
  }

  if (loading) {
    return <div className="flex h-[80vh] items-center justify-center text-white/40"><div className="w-6 h-6 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin mr-3" /> Booting Command Center...</div>;
  }

  return (
    <div className="flex flex-col gap-6 relative pb-10">
      
      {/* ─── 🤖 AI DAILY COMMANDER HEADER ─── */}
      <AIDailyCommander 
        stats={dashboardStats} 
        userName={user?.user_metadata?.full_name?.split(' ')[0] || "Pilot"}
        onStartDay={() => setIsPlannerOpen(true)} 
      />

      {/* 🚀 THE NEW PROACTIVE AI ENGINE */}
      <AIInsightsWidget />

      {/* ─── BENTO BOX GRID ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* 1. URGENT ASSIGNMENTS */}
        <div className="lg:col-span-1 bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col h-[400px]">
          <div className="flex justify-between items-center mb-5">
            <div className="flex items-center gap-2">
              <span className="text-xl drop-shadow-md">⚡</span>
              <h3 className="text-slate-100 font-semibold text-[15px]">Action Items</h3>
            </div>
            <Link to="/assignments" className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors bg-indigo-500/10 px-3 py-1.5 rounded-lg">View All</Link>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 -mr-2 flex flex-col gap-3">
            {dashboardStats.urgentTasks.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center border border-dashed border-white/5 rounded-2xl p-6">
                <span className="text-4xl mb-3">✅</span>
                <span className="text-[13px] font-bold text-white/60">All caught up!</span>
                <span className="text-[11px] text-white/40 mt-1">No pending assignments.</span>
              </div>
            ) : (
              dashboardStats.urgentTasks.map(task => (
                <div key={task.id} className="bg-[#0d0d14] border border-white/5 p-4 rounded-2xl flex flex-col gap-3 group hover:border-white/20 transition-all shadow-md hover:shadow-lg">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <button 
                        onClick={() => markTaskDone(task.id)}
                        className="mt-0.5 w-6 h-6 rounded-full border-2 border-white/20 hover:border-green-400 hover:bg-green-400/10 flex items-center justify-center transition-all shrink-0 text-transparent hover:text-green-400"
                        title="Mark Complete"
                      >
                        <Icon d={Icons.check} size={12} />
                      </button>
                      <div className="min-w-0">
                        <div className="text-[14px] font-bold text-slate-200 truncate">{task.title}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[11px] font-medium text-white/40 truncate flex items-center gap-1">📘 {task.subject}</span>
                          <span className="text-white/20 text-[10px]">•</span>
                          <span className={`text-[11px] font-medium truncate flex items-center gap-1 ${task.due.includes("Today") ? 'text-red-400' : 'text-white/40'}`}>🗓 {task.due}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-9">
                    <Badge color={task.priority}>{task.priority}</Badge>
                    <Badge color={task.status}>{task.status.replace('-', ' ')}</Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 2. TODAY'S SCHEDULE */}
        <div className="lg:col-span-1 bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col h-[400px]">
          <div className="flex justify-between items-center mb-5">
            <div className="flex items-center gap-2">
              <span className="text-xl drop-shadow-md">📅</span>
              <h3 className="text-slate-100 font-semibold text-[15px]">Today's Classes</h3>
            </div>
            <Link to="/attendance" className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors bg-indigo-500/10 px-3 py-1.5 rounded-lg">View All</Link>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 -mr-2 flex flex-col gap-3">
            {dashboardStats.classesToday.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center border border-dashed border-white/5 rounded-2xl p-6">
                <span className="text-4xl mb-3">🎉</span>
                <span className="text-[13px] font-bold text-white/60">No classes today!</span>
                <span className="text-[11px] text-white/40 mt-1">Enjoy your free time.</span>
              </div>
            ) : (
              dashboardStats.classesToday.map(c => {
                const pct = c.total > 0 ? Math.round((c.present / c.total) * 100) : 0;
                const isSafe = pct >= c.required;
                return (
                  <div key={c.id} className="bg-[#0d0d14] border border-white/5 p-4 rounded-2xl group hover:border-white/20 transition-colors shadow-md flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                      <div className="min-w-0 pr-3">
                        <div className="text-[15px] font-bold text-slate-200 truncate">{c.subject}</div>
                        <div className="text-[11px] text-white/40 mt-1 font-medium">Target: {c.required}% • Attended: {c.present}/{c.total}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className={`text-[18px] font-extrabold leading-none ${isSafe ? 'text-green-400' : 'text-red-400'}`}>{pct}%</div>
                        <div className="mt-1.5 flex justify-end">
                          <Badge color={isSafe ? "completed" : "overdue"}>{isSafe ? "Safe" : "Warning"}</Badge>
                        </div>
                      </div>
                    </div>
                    <div className="relative mt-1">
                      <ProgressBar value={pct} color={isSafe ? "#4ade80" : "#f87171"} height={6} />
                      <div className="absolute top-[-3px] bottom-[-3px] w-[2px] bg-white rounded-full z-10 opacity-80" style={{ left: `${c.required}%` }} title="Target Line" />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 3. RIGHT COLUMN (Habits + Finance Mini-Widgets) */}
        <div className="lg:col-span-1 flex flex-col gap-6 h-[400px]">
          
          {/* Daily Habits Checklist */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex-1 flex flex-col min-h-0">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xl drop-shadow-md">🔥</span>
                <h3 className="text-slate-100 font-semibold text-[15px]">Daily Habits</h3>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 -mr-2 flex flex-col gap-3">
              {habits.length === 0 ? (
                <div className="text-[12px] text-white/40 text-center py-4 border border-dashed border-white/5 rounded-xl">No habits set up yet.</div>
              ) : (
                habits.map(habit => {
                  const isDone = habit.last_completed === todayStr;
                  return (
                    <div key={habit.id} className="flex items-center justify-between bg-[#0d0d14] border border-white/5 p-3 rounded-xl hover:border-white/20 transition-colors group shadow-md">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-2xl shrink-0 bg-white/5 w-10 h-10 flex items-center justify-center rounded-lg">{habit.icon}</span>
                        <div className="min-w-0">
                          <div className={`text-[13px] font-bold truncate transition-colors ${isDone ? 'text-white/30 line-through' : 'text-slate-200'}`}>{habit.name}</div>
                          <div className="text-[10px] font-bold text-orange-400 mt-0.5">🔥 {habit.streak} Streak</div>
                        </div>
                      </div>
                      <button 
                        onClick={() => toggleHabit(habit)} 
                        className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center transition-all shrink-0 ${isDone ? 'border-green-400 bg-green-400/20 text-green-400 scale-110' : 'border-white/20 text-transparent hover:border-amber-400 hover:bg-amber-400/10'}`}
                      >
                        <Icon d={Icons.check} size={14} />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Quick Finance Glance */}
          <Link to="/expenses" className="bg-gradient-to-br from-[#0d0d14] to-white/[0.02] border border-white/10 rounded-3xl p-6 hover:border-orange-500/50 transition-colors group relative overflow-hidden shrink-0 shadow-lg">
            <div className="absolute -right-2 -bottom-2 text-7xl opacity-10 group-hover:scale-110 transition-transform duration-500 drop-shadow-2xl">💳</div>
            <h3 className="text-white/40 text-[11px] uppercase tracking-widest font-bold mb-2">Financial Health</h3>
            <div className="flex justify-between items-end mt-2 relative z-10">
              <div>
                <div className={`text-[24px] font-extrabold font-['Sora'] leading-none ${dashboardStats.budgetRemaining > 0 ? 'text-orange-400' : 'text-red-400'}`}>
                  ₹{dashboardStats.budgetRemaining.toLocaleString()}
                </div>
                <div className="text-[10px] text-white/50 font-bold mt-1.5 tracking-wide">REMAINING THIS MONTH</div>
              </div>
              <div className="text-right">
                <div className="text-[15px] font-bold text-slate-200">-₹{dashboardStats.spentToday.toLocaleString()}</div>
                <div className="text-[10px] text-white/50 font-bold mt-1.5 tracking-wide">SPENT TODAY</div>
              </div>
            </div>
          </Link>

        </div>
      </div>

      {/* ─── BOTTOM ROW: DEEP WORK TIMER CTA ─── */}
      <div className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative shadow-2xl">
        <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_right,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent pointer-events-none" />
        
        <div className="flex items-center gap-5 z-10">
          <div className="w-16 h-16 bg-[#0d0d14] rounded-2xl border border-indigo-500/50 flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.3)]">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <div>
            <h3 className="text-[18px] font-extrabold text-white font-['Sora'] drop-shadow-md">Time to focus?</h3>
            <p className="text-[13px] text-indigo-200/80 mt-1 font-medium">Start a Pomodoro session and crush your pending tasks.</p>
          </div>
        </div>

        <Link to="/timer" className="w-full md:w-auto px-8 py-3.5 bg-indigo-500 text-white text-[14px] font-extrabold rounded-xl hover:bg-indigo-400 hover:scale-105 active:scale-95 transition-all text-center shadow-lg shadow-indigo-500/40 z-10">
          Launch Focus Timer
        </Link>
      </div>

      {/* 🗺️ SMART DAY PLANNER MODAL */}
      <StartMyDayModal 
        isOpen={isPlannerOpen} 
        onClose={() => setIsPlannerOpen(false)} 
        stats={dashboardStats} 
      />

    </div>
  );
}