import React, { useState, useEffect, useMemo } from "react";
import StatCard from "../components/ui/StatCard";
import ProgressBar from "../components/ui/ProgressBar";
import Modal from "../components/ui/Modal";
import { Icon, Icons } from "../components/ui/Icon";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import StoreModal from "../components/goals/StoreModal";
import DailyQuests from "../components/goals/DailyQuests";
import HabitAnalytics from "../components/goals/HabitAnalytics";
import AIHabitCoach from "../components/goals/AIHabitCoach";
import AddGoalModal from "../components/goals/AddGoalModal";

const EMOJI_LIST = ["📚", "💻", "🏃‍♂️", "🧘‍♀️", "💧", "🥗", "🎸", "💸", "📝", "🏆", "🧠", "⚡", "🎁", "🍕", "🎮", "📺"];

const THEME_OPTIONS = {
  default: { name: "GradPilot Default", cost: 0, class: "" },
  matcha: { name: "Matcha Mint", cost: 2000, class: "hue-rotate-[-110deg] saturate-150" },
  cyberpunk: { name: "Cyberpunk Neon", cost: 5000, class: "hue-rotate-[60deg] saturate-200 contrast-125" },
  gold: { name: "Executive Gold", cost: 10000, class: "hue-rotate-[160deg] saturate-50 sepia-[.3]" }
};

// ─── NEW: COSMETICS CATALOG ───
const SHOP_FRAMES = [
  { id: "none", name: "Standard", cost: 0, class: "", icon: "⚪" },
  { id: "bronze", name: "Bronze Novice", cost: 500, class: "border-4 border-orange-700 shadow-[0_0_15px_rgba(194,65,12,0.5)]", icon: "🥉" },
  { id: "gold", name: "Gold Scholar", cost: 2000, class: "border-4 border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.8)]", icon: "👑" },
  { id: "neon", name: "Cyberpunk Glow", cost: 5000, class: "border-4 border-fuchsia-500 shadow-[0_0_25px_rgba(217,70,239,0.9)] animate-pulse", icon: "⚡" },
  { id: "radiant", name: "Radiant Diamond", cost: 10000, class: "p-1 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 shadow-[0_0_30px_rgba(34,211,238,0.8)] animate-[spin_3s_linear_infinite]", icon: "💎", isGradient: true }
];

export default function Goals() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Data States
  const [habits, setHabits] = useState([]);
  const [goals, setGoals] = useState([]);
  const [customRewards, setCustomRewards] = useState([]);
  const [userSettings, setUserSettings] = useState({ xp_spent: 0, active_theme: 'default', unlocked_themes: ['default'] });
  
  // Profile Engine (Focus Timer XP, Streaks, and new Avatar Frames)
  const [profile, setProfile] = useState({ total_xp: 0, current_streak: 0, streak_freezes_owned: 0, longest_streak: 0, equipped_frame: 'none', owned_frames: ['none'] });

  // UI States
  const [isHabitModalOpen, setIsHabitModalOpen] = useState(false);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isStoreOpen, setIsStoreOpen] = useState(false);
  const [storeTab, setStoreTab] = useState("rewards"); // "rewards" | "themes" | "frames"
  const [redeemCelebration, setRedeemCelebration] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Forms
  const [newHabit, setNewHabit] = useState({ name: "", icon: "📚" });
  const [newGoal, setNewGoal] = useState({ title: "", deadline: "", emoji: "🎯" });
  const [newReward, setNewReward] = useState({ title: "", cost: 500, icon: "🎁" });

  // ⏰ FIX: Local Timezone Math
  const getLocalDateString = (dateObj) => {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const today = new Date();
  const todayStr = getLocalDateString(today);

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = getLocalDateString(yesterday);

  useEffect(() => {
      document.title = "Goals & XP | GradPilot";
    }, []);

  // ─── GLOBAL THEME INJECTION ───
  useEffect(() => {
    if (userSettings?.active_theme) {
      const themeClass = THEME_OPTIONS[userSettings.active_theme]?.class || "";
      document.documentElement.className = themeClass;
    }
  }, [userSettings?.active_theme]);

  // ─── 🛡️ SAFE DATA FETCHING (Bugs 1 & 2) ───
  useEffect(() => {
    if (!user?.id) return; // 🐛 Bug 1: CRITICAL Null guard
    fetchData();
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [habitsRes, goalsRes, rewardsRes, settingsRes, profileRes] = await Promise.all([
        supabase.from('habits').select('*').eq('user_id', user.id).order('created_at', { ascending: true }),
        supabase.from('goals').select('*').eq('user_id', user.id).order('created_at', { ascending: true }),
        supabase.from('custom_rewards').select('*').eq('user_id', user.id).order('cost', { ascending: true }),
        supabase.from('user_settings').select('*').eq('user_id', user.id).single(),
        supabase.from('profiles').select('*').eq('id', user.id).single()
      ]);

      // 🐛 Bug 2: Strict Error Checking
      if (habitsRes.error) throw habitsRes.error;

      if (habitsRes.data) setHabits(habitsRes.data);
      if (goalsRes.data) setGoals(goalsRes.data);
      if (rewardsRes.data) setCustomRewards(rewardsRes.data);
      if (settingsRes.data) setUserSettings(settingsRes.data);
      if (profileRes.data) setProfile(prev => ({ ...prev, ...profileRes.data }));
      
    } catch (error) {
      console.error("Fetch Data Error:", error);
      showToast("Failed to sync your data. Please refresh.");
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  // ─── 🛡️ GAMIFICATION & XP MATH (Bug 3 & 6 Fix) ───
  const gamification = useMemo(() => {
    const habitsDoneToday = habits.filter(h => h.last_completed === todayStr).length;
    const highestStreak = habits.length > 0 ? Math.max(...habits.map(h => h.streak)) : 0;
    const goalsCompleted = goals.filter(g => g.progress === 100).length;

    // 🐛 Bug 3 Fix: Single Source of Truth for XP. No more double counting!
    const totalEarnedXp = profile.total_xp || 0; 
    const currentBalance = Math.max(0, totalEarnedXp - (userSettings?.xp_spent || 0));

    const badges = [
      { id: "b1", icon: "🔥", name: "On Fire", desc: "Reach a 5-day habit streak", earned: highestStreak >= 5 },
      { id: "b2", icon: "⚡", name: "Unstoppable", desc: "Reach a 14-day habit streak", earned: highestStreak >= 14 },
      { id: "b3", icon: "🎯", name: "Goal Crusher", desc: "Complete your first goal", earned: goalsCompleted >= 1 },
      { id: "b4", icon: "🏆", name: "Overachiever", desc: "Complete 3+ goals", earned: goalsCompleted >= 3 },
      { id: "b5", icon: "💎", name: "Perfect Day", desc: "Complete all habits in a day", earned: habits.length > 0 && habitsDoneToday === habits.length },
      { id: "b6", icon: "🌟", name: "Level 10", desc: "Earn 5,000+ XP", earned: totalEarnedXp >= 5000 },
    ];

    return { habitsDoneToday, highestStreak, totalEarnedXp, currentBalance, badges, badgesEarned: badges.filter(b=>b.earned).length };
  }, [habits, goals, todayStr, userSettings?.xp_spent, profile.total_xp]); 
  // 🐛 Bug 6 Fix: Minimized dependencies so this doesn't run on every single tiny re-render

  // ─── RPG LEVEL MATH ───
  const currentLevel = Math.floor((profile.total_xp || 0) / 1000) + 1;
  const levelProgressPct = ((profile.total_xp || 0) % 1000) / 10; 
  const xpToNextLevel = 1000 - ((profile.total_xp || 0) % 1000);

  // ─── HABIT & GOAL LOGIC ───
  const handleAddHabit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const { data } = await supabase.from('habits').insert([{ user_id: user.id, name: newHabit.name, icon: newHabit.icon }]).select();
    if (data) { setHabits([...habits, data[0]]); setIsHabitModalOpen(false); setNewHabit({ name: "", icon: "📚" }); showToast("Habit created!"); }
    setIsSubmitting(false);
  };

  const toggleHabit = async (habit) => {
    const isDoneToday = habit.last_completed === todayStr;
    let newStreak = habit.streak;
    let newLastCompleted = habit.last_completed;

    if (isDoneToday) {
      // 🐛 FIX: The Un-Check Bug! Revert to yesterday if streak > 0!
      newStreak = Math.max(0, habit.streak - 1);
      newLastCompleted = newStreak > 0 ? yesterdayStr : null; 
    } else {
      newStreak = (habit.last_completed === yesterdayStr) ? habit.streak + 1 : 1;
      newLastCompleted = todayStr;
    }

    setHabits(prev => prev.map(h => h.id === habit.id ? { ...h, streak: newStreak, last_completed: newLastCompleted } : h));
    await supabase.from('habits').update({ streak: newStreak, last_completed: newLastCompleted }).eq('id', habit.id).eq('user_id', user.id);
  };

  const deleteHabit = async (id) => {
    if(!window.confirm("Delete this habit?")) return;
    
    // 🐛 Bug 4 Fix: Optimistic Rollback
    const previousHabits = [...habits];
    setHabits(prev => prev.filter(h => h.id !== id));
    
    const { error } = await supabase.from('habits').delete().eq('id', id).eq('user_id', user.id);
    if (error) {
      setHabits(previousHabits);
      showToast("Failed to delete habit. Try again.");
    }
  };

  const handleAddGoal = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // 1. Insert the Goal
    const { data, error: goalError } = await supabase
      .from('goals')
      .insert([{ user_id: user.id, title: newGoal.title, deadline: newGoal.deadline, emoji: newGoal.emoji }])
      .select();
      
    if (goalError) {
      console.error("Goal Insert Error:", goalError);
      showToast("Failed to create goal.");
      setIsSubmitting(false);
      return;
    }

    if (data) { 
      setGoals([data[0], ...goals]); 

      // 2. Insert the AI Tasks (The Cross-Module Magic)
      if (newGoal.generatedTasks && newGoal.generatedTasks.length > 0) {
        const tasksToInsert = newGoal.generatedTasks.map(taskTitle => ({
          user_id: user.id,
          title: taskTitle,
          subject: `Goal: ${newGoal.title.substring(0, 10)}...`,
          status: 'pending',
          priority: 'Medium',           // Matches your 'priority' column
          due: newGoal.deadline         // 👈 MATCHES YOUR 'due' COLUMN EXACTLY!
        }));
        
        const { error: taskError } = await supabase.from('tasks').insert(tasksToInsert);
        
        if (taskError) {
          console.error("🚨 Supabase Task Error Details:", taskError);
          alert(`Failed to save AI tasks: ${taskError.message}`); 
        }
      }

      setIsGoalModalOpen(false); 
      setNewGoal({ title: "", deadline: "", emoji: "🎯", generatedTasks: null }); 
      showToast("Goal & Action Plan created! 🚀"); 
    }
    setIsSubmitting(false);
  };

  const updateGoalProgress = async (id, currentProgress, change) => {
    let newProgress = Math.max(0, Math.min(100, currentProgress + change));
    setGoals(prev => prev.map(g => g.id === id ? { ...g, progress: newProgress } : g));
    await supabase.from('goals').update({ progress: newProgress }).eq('id', id).eq('user_id', user.id);
    if(newProgress === 100 && currentProgress !== 100) showToast("Goal Completed! 🎉");
  };

  const deleteGoal = async (id) => {
    if(!window.confirm("Delete this goal?")) return;
    
    // 🐛 Bug 4 Fix: Optimistic Rollback
    const previousGoals = [...goals];
    setGoals(prev => prev.filter(g => g.id !== id));
    
    const { error } = await supabase.from('goals').delete().eq('id', id).eq('user_id', user.id);
    if (error) {
      setGoals(previousGoals);
      showToast("Failed to delete goal. Try again.");
    }
  };

  // ─── STORE & THEME LOGIC ───
  const handleCreateReward = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const { data } = await supabase.from('custom_rewards').insert([{ user_id: user.id, title: newReward.title, cost: newReward.cost, icon: newReward.icon }]).select();
    if (data) { setCustomRewards([...customRewards, data[0]].sort((a,b)=>a.cost-b.cost)); setNewReward({ title: "", cost: 500, icon: "🎁" }); }
    setIsSubmitting(false);
  };

  const handleDeleteReward = async (id) => {
    setCustomRewards(prev => prev.filter(r => r.id !== id));
    await supabase.from('custom_rewards').delete().eq('id', id).eq('user_id', user.id);
  };

  const redeemReward = async (reward) => {
    // 💰 FIX: Strict frontend validation using your toast!
    if (gamification.currentBalance < reward.cost) { 
      showToast("Not enough XP to redeem this reward!"); 
      return; 
    }
    const newSpent = userSettings.xp_spent + reward.cost;
    setUserSettings(prev => ({ ...prev, xp_spent: newSpent }));
    await supabase.from('user_settings').update({ xp_spent: newSpent }).eq('user_id', user.id);
    setRedeemCelebration(`Enjoy: ${reward.title} ${reward.icon}`);
    setTimeout(() => setRedeemCelebration(null), 4000);
  };

  const handleBuyOrEquipTheme = async (themeKey, config) => {
    const isUnlocked = userSettings.unlocked_themes.includes(themeKey);
    if (isUnlocked) {
      setUserSettings(prev => ({ ...prev, active_theme: themeKey }));
      await supabase.from('user_settings').update({ active_theme: themeKey }).eq('user_id', user.id);
      showToast("Theme Equipped!");
    } else {
      // 💰 FIX: Strict frontend validation!
      if (gamification.currentBalance < config.cost) { 
        showToast("Nice try! Not enough XP to buy this theme."); 
        return; 
      }
      const newSpent = userSettings.xp_spent + config.cost;
      const newUnlocked = [...userSettings.unlocked_themes, themeKey];
      setUserSettings(prev => ({ ...prev, xp_spent: newSpent, unlocked_themes: newUnlocked, active_theme: themeKey }));
      await supabase.from('user_settings').update({ xp_spent: newSpent, unlocked_themes: newUnlocked, active_theme: themeKey }).eq('user_id', user.id);
      showToast("Theme Unlocked & Equipped!");
    }
  };

  const handleBuyFreeze = async () => {
    // 💰 FIX: Strict frontend validation!
    if (gamification.currentBalance < 500) { 
      showToast("Not enough XP to buy a Freeze!"); 
      return; 
    }
    const newSpent = userSettings.xp_spent + 500;
    const newFreezes = profile.streak_freezes_owned + 1;
    setUserSettings(prev => ({ ...prev, xp_spent: newSpent }));
    setProfile(prev => ({ ...prev, streak_freezes_owned: newFreezes }));
    await Promise.all([
      supabase.from('user_settings').update({ xp_spent: newSpent }).eq('user_id', user.id),
      supabase.from('profiles').update({ streak_freezes_owned: newFreezes }).eq('id', user.id)
    ]);
    showToast("Streak Freeze equipped! 🧊");
  };

  // ─── NEW: AVATAR FRAME LOGIC ───
  const handleBuyOrEquipFrame = async (frame) => {
    const isUnlocked = profile.owned_frames?.includes(frame.id) || frame.id === "none";
    
    if (isUnlocked) {
      setProfile(prev => ({ ...prev, equipped_frame: frame.id }));
      await supabase.from('profiles').update({ equipped_frame: frame.id }).eq('id', user.id);
      showToast("Frame Equipped!");
    } else {
      // 💰 FIX: Strict frontend validation!
      if (gamification.currentBalance < frame.cost) { 
        showToast("Nice try! Not enough XP to buy this frame."); 
        return; 
      }
      
      const newSpent = userSettings.xp_spent + frame.cost;
      const newOwned = [...(profile.owned_frames || ['none']), frame.id];
      
      setUserSettings(prev => ({ ...prev, xp_spent: newSpent }));
      setProfile(prev => ({ ...prev, owned_frames: newOwned, equipped_frame: frame.id }));
      
      await Promise.all([
        supabase.from('user_settings').update({ xp_spent: newSpent }).eq('user_id', user.id),
        supabase.from('profiles').update({ owned_frames: newOwned, equipped_frame: frame.id }).eq('id', user.id)
      ]);
      showToast("Frame Unlocked & Equipped! ✨");
    }
  };

  const getInitials = () => {
    const name = profile?.full_name || user?.email || "U";
    return name.charAt(0).toUpperCase();
  };

  return (
    <div className="flex flex-col gap-6 relative pb-10">
      
      {redeemCelebration && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
          <div className="text-[100px] animate-[bounce_1s_ease-in-out_infinite]">🎉</div>
          <h2 className="text-4xl font-extrabold text-white mt-4 tracking-tight">TICKET REDEEMED!</h2>
          <p className="text-xl text-indigo-400 mt-2 font-medium">{redeemCelebration}</p>
          <p className="text-white/40 mt-6 text-sm">You earned this break. Go enjoy it!</p>
        </div>
      )}

      {/* 🚀 UPGRADED HEADER: RPG LEVEL SYSTEM & STORE BANNER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-gradient-to-br from-indigo-500/10 to-purple-500/5 border border-indigo-500/20 p-6 rounded-2xl relative overflow-hidden shadow-lg">
        <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/10 blur-[60px] rounded-full pointer-events-none" />
        
        <div className="flex-1 w-full relative z-10">
          <div className="flex items-end gap-3 mb-2">
            <h2 className="text-slate-100 font-extrabold text-[24px] font-['Plus_Jakarta_Sans'] leading-none">Level {currentLevel}</h2>
            <p className="text-indigo-300/60 text-[13px] font-medium leading-none pb-0.5">Discipline Architect</p>
          </div>
          
          <div className="flex items-center gap-4 w-full max-w-md">
            <div className="flex-1">
              <ProgressBar value={levelProgressPct} color="#a855f7" height={8} />
            </div>
            <div className="text-[11px] font-bold text-white/40 whitespace-nowrap uppercase tracking-widest">
              {xpToNextLevel} XP to Next
            </div>
          </div>
        </div>
        
        <button onClick={() => setIsStoreOpen(true)} className="relative z-10 flex items-center gap-3 px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:scale-105 transition-all w-full md:w-auto shrink-0">
          <div className="flex flex-col text-left mr-2">
            <span className="text-[10px] uppercase font-bold text-amber-100/70 tracking-widest leading-none">Wallet Balance</span>
            <span className="text-[16px] font-extrabold leading-none mt-1">{gamification.currentBalance.toLocaleString()} XP</span>
          </div>
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center text-xl">🛒</div>
        </button>
      </div>

      {/* 📜 NEW: DAILY QUESTS MODULE */}
      <DailyQuests 
        habitsDoneToday={gamification.habitsDoneToday} 
        highestStreak={gamification.highestStreak} 
        goalsCompleted={goals.filter(g => g.progress === 100).length} 
      />

      {/* STAT CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Platform Streak" value={`${profile.current_streak} Days`} sub={`Best: ${profile.longest_streak} days`} icon="fire" color="#fb923c" />
        <StatCard label="Streak Freezes" value={profile.streak_freezes_owned} sub="Equipped protections" icon="star" color="#22d3ee" />
        <StatCard label="Habits Today" value={`${gamification.habitsDoneToday}/${habits.length}`} sub="Daily completion" icon="check" color={gamification.habitsDoneToday === habits.length && habits.length > 0 ? "#4ade80" : "#818cf8"} />
        <StatCard label="Badges" value={gamification.badgesEarned} sub="Unlocked achievements" icon="trophy" color="#a855f7" />
      </div>

      {/* 🧠 MODULAR ANALYTICS & AI COACH */}
      {habits.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-2">
          <HabitAnalytics habits={habits} />
          <AIHabitCoach habits={habits} habitsDoneToday={gamification.habitsDoneToday} />
        </div>
      )}

      {/* ROW 1: DAILY HABITS */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-slate-100 font-semibold text-[15px]">Daily Habits</h3>
          <button onClick={() => setIsHabitModalOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 text-[12px] font-bold transition-colors shrink-0">
            <Icon d={Icons.plus} size={12} /> Add Habit
          </button>
        </div>

        {loading ? (
          <div className="text-white/40 text-[13px] text-center py-5">Loading...</div>
        ) : habits.length === 0 ? (
          <div className="text-white/30 text-[13px] text-center border border-dashed border-white/10 rounded-xl p-8">No habits yet. Start small!</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {habits.map(habit => {
              const isDone = habit.last_completed === todayStr;
              return (
                <div key={habit.id} className="group flex items-center justify-between p-4 rounded-xl border border-white/5 bg-[#0d0d14] hover:border-white/10 transition-all w-full">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-2xl shrink-0">{habit.icon}</div>
                    <div className="min-w-0">
                      <div className={`text-[14px] font-bold truncate transition-colors ${isDone ? 'text-white/40 line-through' : 'text-slate-200'}`} title={habit.name}>{habit.name}</div>
                      <div className="text-[11px] font-bold text-orange-400 mt-0.5">🔥 {habit.streak} Day Streak</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <button onClick={() => deleteHabit(habit.id)} className="opacity-0 group-hover:opacity-100 w-8 h-8 flex items-center justify-center text-white/20 hover:text-red-400 transition-all shrink-0"><Icon d={Icons.x} size={14} /></button>
                    <button onClick={() => toggleHabit(habit)} className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center transition-all shrink-0 ${isDone ? 'border-green-400 bg-green-400/20 text-green-400 scale-110' : 'border-white/20 text-transparent hover:border-indigo-400 hover:bg-indigo-400/10'}`}>
                      <Icon d={Icons.check} size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ROW 2: PERSONAL GOALS */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-slate-100 font-semibold text-[15px]">Personal Goals</h3>
          <button onClick={() => setIsGoalModalOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 text-[12px] font-bold transition-colors shrink-0">
            <Icon d={Icons.plus} size={12} /> Add Goal
          </button>
        </div>

        {loading ? (
          <div className="text-white/40 text-[13px] text-center py-5">Loading...</div>
        ) : goals.length === 0 ? (
          <div className="text-white/30 text-[13px] text-center border border-dashed border-white/10 rounded-xl p-8">No active goals. Set your sights on something big!</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {goals.map(goal => {
              const isComplete = goal.progress === 100;
              return (
                <div key={goal.id} className="relative group bg-[#0d0d14] border border-white/5 rounded-xl p-5 hover:border-white/10 transition-all flex flex-col justify-between w-full h-full">
                  <button onClick={() => deleteGoal(goal.id)} className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-red-500/10 text-red-400 opacity-0 md:opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all hover:bg-red-500/20 z-10 shrink-0" title="Delete"><Icon d={Icons.x} size={12} /></button>
                  <div className="flex gap-4 mb-4 items-start min-w-0">
                    <div className="text-3xl shrink-0 bg-white/5 w-12 h-12 flex items-center justify-center rounded-xl">{goal.emoji}</div>
                    <div className="flex-1 min-w-0 pr-6">
                      <div className={`text-[15px] font-bold truncate ${isComplete ? 'text-green-400' : 'text-slate-200'}`} title={goal.title}>{goal.title}</div>
                      <div className="text-[10px] text-white/40 mt-1 uppercase tracking-wider font-bold truncate">Due: {new Date(goal.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 w-full">
                    <div className="flex-1 min-w-0">
                      <ProgressBar value={goal.progress} color={isComplete ? "#4ade80" : "#818cf8"} height={8} />
                      <div className="text-[12px] font-bold text-white/40 mt-2 text-right">{goal.progress}%</div>
                    </div>
                    {!isComplete && (
                      <div className="flex gap-1.5 shrink-0">
                        <button onClick={() => updateGoalProgress(goal.id, goal.progress, -10)} className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors text-white/50 hover:text-white font-bold text-lg shrink-0">-</button>
                        <button onClick={() => updateGoalProgress(goal.id, goal.progress, 10)} className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors text-white/50 hover:text-white font-bold text-lg shrink-0">+</button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ROW 3: ACHIEVEMENTS */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <h3 className="text-slate-100 font-semibold text-[15px] mb-5">🏆 Achievements</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {gamification.badges.map(b => (
            <div key={b.id} className={`p-4 rounded-xl border flex flex-col gap-2 items-center text-center transition-all duration-500 w-full ${b.earned ? 'bg-gradient-to-br from-amber-500/10 to-orange-500/5 border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.1)]' : 'bg-[#0d0d14] border-white/5 grayscale opacity-40'}`}>
              <div className="text-4xl drop-shadow-md shrink-0">{b.icon}</div>
              <div className="w-full min-w-0">
                <div className={`text-[12px] font-extrabold truncate ${b.earned ? 'text-amber-400' : 'text-slate-300'}`}>{b.name}</div>
                <div className="text-[10px] text-white/40 leading-tight mt-1">{b.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 🛒 MODULAR STORE MODAL */}
      <StoreModal 
        isStoreOpen={isStoreOpen} setIsStoreOpen={setIsStoreOpen} gamification={gamification}
        storeTab={storeTab} setStoreTab={setStoreTab} profile={profile}
        handleBuyFreeze={handleBuyFreeze} newReward={newReward} setNewReward={setNewReward}
        handleCreateReward={handleCreateReward} isSubmitting={isSubmitting} customRewards={customRewards}
        handleDeleteReward={handleDeleteReward} redeemReward={redeemReward} userSettings={userSettings}
        handleBuyOrEquipTheme={handleBuyOrEquipTheme} THEME_OPTIONS={THEME_OPTIONS} SHOP_FRAMES={SHOP_FRAMES}
        getInitials={getInitials} handleBuyOrEquipFrame={handleBuyOrEquipFrame}
        habits={habits} goals={goals} totalXp={profile.total_xp}
      />

      {/* MODALS */}
      <Modal isOpen={isHabitModalOpen} onClose={() => setIsHabitModalOpen(false)} title="Create Daily Habit">
        <form onSubmit={handleAddHabit} className="flex flex-col gap-5">
          <div><label className="block text-[11px] font-bold text-white/40 uppercase tracking-wider mb-1.5">Habit Name *</label><input required type="text" value={newHabit.name} onChange={e => setNewHabit({...newHabit, name: e.target.value})} className="w-full bg-[#0d0d14] border border-white/10 rounded-xl px-4 py-3 text-slate-200 text-[13px] outline-none focus:border-indigo-500/50" /></div>
          <div><label className="block text-[11px] font-bold text-white/40 uppercase tracking-wider mb-2">Choose Icon</label>
            <div className="flex flex-wrap gap-2">{EMOJI_LIST.map(emoji => (<button key={emoji} type="button" onClick={() => setNewHabit({...newHabit, icon: emoji})} className={`w-11 h-11 shrink-0 rounded-xl text-xl transition-all ${newHabit.icon === emoji ? 'bg-indigo-500/20 border border-indigo-500/50 scale-110 shadow-md' : 'bg-[#0d0d14] border border-white/5 hover:bg-white/5 hover:scale-105'}`}>{emoji}</button>))}</div>
          </div>
          <button type="submit" disabled={isSubmitting} className="w-full mt-2 bg-gradient-to-br from-indigo-500 to-purple-500 text-white font-bold text-[13px] py-3.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50">Create Habit</button>
        </form>
      </Modal>

      {/* 🧠 MODULAR SMART GOAL MODAL */}
      <AddGoalModal 
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
        handleAddGoal={handleAddGoal}
        newGoal={newGoal}
        setNewGoal={setNewGoal}
        isSubmitting={isSubmitting}
        EMOJI_LIST={EMOJI_LIST}
      />

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-green-500/10 border border-green-500/30 text-green-400 px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-[fadeIn_0.3s_ease-out]">
          <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">✓</div><span className="text-[13px] font-bold">{toast}</span>
        </div>
      )}

    </div>
  );
}