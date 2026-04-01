import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function AIDailyCommander({ stats, userName, onStartDay }) {
  const [briefing, setBriefing] = useState(null);
  const [isGenerating, setIsGenerating] = useState(true);

  useEffect(() => {
    const generateBriefing = async () => {
      if (!stats) return;
      setIsGenerating(true);
      
      try {
        const prompt = `Act as an elite AI assistant (like JARVIS) for a student named ${userName}.
        Current Time: ${stats.greeting}.
        Data: 
        - ${stats.urgentTasks.length} highly urgent/overdue tasks.
        - ${stats.classesToday.length} classes scheduled today.
        - ${stats.habitsLeft} daily habits remaining.
        - Budget remaining: ₹${stats.budgetRemaining}.

        Write a 2-sentence tactical briefing.
        Sentence 1: Greet them and state their PRIMARY MISSION for today based on the most pressing data (e.g., if tasks are high, focus on tasks. If budget is low, warn them).
        Sentence 2: Give a quick, punchy, encouraging command. 
        Keep it under 35 words total. No markdown.`;

        const { data, error } = await supabase.functions.invoke('ai-chat', { body: { prompt } });
        if (error) throw error;
        
        setBriefing(data.reply);
      } catch (err) {
        console.error("AI Commander Error:", err);
        // Fallback if offline or AI fails
        setBriefing(`${stats.greeting}, ${userName}. You have ${stats.urgentTasks.length} urgent tasks and ${stats.habitsLeft} habits left today. Let's get to work.`);
      } finally {
        setIsGenerating(false);
      }
    };

    generateBriefing();
  }, [stats.urgentTasks.length, stats.classesToday.length, stats.habitsLeft]); // Only re-run if their daily workload changes

return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 animate-[fadeIn_0.5s_ease-out]">
      <div className="flex-1 max-w-2xl">
        <h2 className="text-[28px] font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 font-['Sora'] tracking-tight flex items-center gap-2">
          {stats.greeting}, {userName}.
        </h2>
        
        <div className="mt-2 min-h-[40px]">
          {isGenerating ? (
            <div className="flex items-center gap-2 text-[14px] text-indigo-300/60 font-medium">
              <span className="w-3 h-3 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin" />
              Generating tactical briefing...
            </div>
          ) : (
            // 👇 FIX: Wrapped the paragraph and button in a Flexbox DIV
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mt-2">
              <p className="text-slate-200 text-[14px] font-medium leading-relaxed border-l-2 border-indigo-500 pl-3 bg-indigo-500/5 py-1 rounded-r-lg max-w-xl">
                {briefing}
              </p>
              
              {/* 🚀 THE ONE-CLICK MODE TRIGGER */}
              <button 
                onClick={onStartDay}
                className="px-5 py-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 text-[12px] font-bold hover:bg-indigo-500 hover:text-white transition-all shadow-lg shadow-indigo-500/10 flex items-center gap-2 shrink-0"
              >
                ⚡ Start My Day
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-2 shrink-0 mt-2 md:mt-0">
        <div className="bg-[#0d0d14] border border-white/10 px-4 py-2 rounded-xl flex items-center gap-2 text-[12px] font-bold text-slate-200 shadow-lg">
          <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" /> {stats.pendingTasks.length} Pending
        </div>
        <div className="bg-[#0d0d14] border border-white/10 px-4 py-2 rounded-xl flex items-center gap-2 text-[12px] font-bold text-slate-200 shadow-lg">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" /> {stats.habitsLeft} Habits Left
        </div>
      </div>
    </div>
  );
}