import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

// 🗺️ THE ROUTE MAP: Tells the app where to send the user for each quest
const QUEST_ROUTES = {
  "Complete 2 Pomodoro Sessions": "/timer",
  "Log a new study resource": "/assignments", // Change this to your resources page if you have one
  "Review your weekly analytics": "/", // Dashboard
  "Achieve a 3-day focus streak": "/timer",
  "Organize your upcoming assignments": "/assignments"
};

const QUEST_POOL = [
  { title: "Complete 2 Pomodoro Sessions", xp: 50 },
  { title: "Log a new study resource", xp: 30 },
  { title: "Review your weekly analytics", xp: 20 },
  { title: "Achieve a 3-day focus streak", xp: 100 },
  { title: "Organize your upcoming assignments", xp: 40 }
];

export default function DailyQuests() {
  const [quests, setQuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const hasFetched = useRef(false);

  useEffect(() => {
    if (!hasFetched.current) {
      fetchOrGenerateQuests();
      hasFetched.current = true;
    }
  }, []);

  const fetchOrGenerateQuests = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date().toISOString().split('T')[0];
      
      const { data: existingQuests, error: fetchError } = await supabase
        .from('daily_quests')
        .select('*')
        .eq('user_id', user.id)
        .eq('assigned_date', today);

      if (fetchError) throw fetchError;

      if (existingQuests && existingQuests.length > 0) {
        setQuests(existingQuests.sort((a, b) => a.id.localeCompare(b.id)).slice(0, 3));
      } else {
        const shuffled = [...QUEST_POOL].sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, 3).map(q => ({
          user_id: user.id,
          title: q.title,
          xp_reward: q.xp,
          assigned_date: today
        }));

        const { data: newQuests, error: insertError } = await supabase
          .from('daily_quests')
          .insert(selected)
          .select();

        if (insertError) throw insertError;
        if (newQuests) setQuests(newQuests);
      }
    } catch (error) {
      console.error("Error loading quests:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="animate-pulse h-48 bg-slate-800/50 rounded-2xl border border-slate-700/50"></div>;
  }

  const completedCount = quests.filter(q => q.is_completed).length;

  // 🎉 THE CELEBRATION BANNER (If 3/3 are complete, show this instead of the full list!)
  if (completedCount === 3) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 rounded-2xl p-4 flex items-center justify-between shadow-lg"
      >
        <div className="flex items-center gap-3">
          <div className="text-3xl drop-shadow-md">🏆</div>
          <div>
            <h3 className="text-emerald-400 font-bold text-[15px]">All Daily Missions Complete!</h3>
            <p className="text-emerald-200/70 text-[12px] font-medium">Amazing focus today. Come back tomorrow for more XP.</p>
          </div>
        </div>
        <div className="text-emerald-400 font-extrabold text-xl bg-emerald-500/10 px-4 py-2 rounded-xl">
          3/3
        </div>
      </motion.div>
    );
  }

  return (
    <div className="bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-800 p-6 flex flex-col gap-4">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>🗺️</span> Daily Quests
          </h2>
          <p className="text-sm text-slate-400 mt-1">Reset every midnight</p>
        </div>
        <div className="text-right">
          <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
            {completedCount} / 3 Completed
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-3 mt-2">
        {quests.map((quest) => {
          const targetRoute = QUEST_ROUTES[quest.title] || "/";
          
          return (
            <motion.div 
              key={quest.id}
              layout
              // 👇 THE REDIRECT CLICK EVENT 👇
              onClick={() => !quest.is_completed && navigate(targetRoute)}
              className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                quest.is_completed 
                  ? 'bg-emerald-500/5 border-emerald-500/20 cursor-default' 
                  : 'bg-slate-800/50 border-slate-700/50 hover:border-indigo-500/50 hover:bg-slate-800 cursor-pointer hover:scale-[1.01] shadow-sm hover:shadow-indigo-500/10'
              }`}
            >
              <div className="flex items-center gap-4">
                <div 
                  title={quest.is_completed ? "Completed!" : "Click to go to this task!"}
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                    quest.is_completed 
                      ? 'bg-emerald-500 border-emerald-500 text-white shadow-[0_0_10px_rgba(16,185,129,0.5)]' 
                      : 'border-slate-500 text-transparent opacity-50'
                  }`}
                >
                  <AnimatePresence>
                    {quest.is_completed && (
                      <motion.svg 
                        initial={{ scale: 0 }} animate={{ scale: 1 }}
                        className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"
                      >
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </motion.svg>
                    )}
                  </AnimatePresence>
                </div>
                <div className="flex flex-col">
                  <span className={`font-medium transition-colors ${quest.is_completed ? 'text-slate-400 line-through' : 'text-slate-200'}`}>
                    {quest.title}
                  </span>
                  {/* Little helper text so they know it's a link */}
                  {!quest.is_completed && (
                    <span className="text-[10px] font-bold text-indigo-400/70 mt-0.5 flex items-center gap-1">
                      Click to travel <span className="text-xs">→</span>
                    </span>
                  )}
                </div>
              </div>
              
              <div className={`text-sm font-bold flex items-center gap-1 ${quest.is_completed ? 'text-emerald-400' : 'text-indigo-400'}`}>
                +{quest.xp_reward} <span className="text-xs opacity-75">XP</span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}