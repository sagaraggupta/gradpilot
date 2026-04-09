import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';

// 🚀 Added user, profile, setProfile to props
export default function AIHabitCoach({ user, profile, setProfile, habits, habitsDoneToday }) {
  const [aiResponse, setAiResponse] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const COACH_COST = 15;

  const getAdvice = async () => {
    if (habits.length === 0) return;
    
    // 1. Check Wallet Balance
    if (!profile || (profile.credits_balance || 0) < COACH_COST) {
      alert(`You need ${COACH_COST} 🪙 Credits to use the AI Coach.`);
      return;
    }

    setIsAnalyzing(true);
    
    // 2. Optimistically deduct credits
    const newBalance = profile.credits_balance - COACH_COST;
    setProfile({ ...profile, credits_balance: newBalance });
    await supabase.from('profiles').update({ credits_balance: newBalance }).eq('id', user.id);

    try {
      // Create a clean summary of their habits to feed to the AI
      const habitSummary = habits.map(h => `${h.name} (Streak: ${h.streak} days)`).join(', ');
      
      const prompt = `Act as a world-class behavioral psychologist and productivity coach. 
      My Daily Habits and Current Streaks: ${habitSummary}. 
      Today's Progress: I have completed ${habitsDoneToday} out of ${habits.length} habits so far today.
      Give me a 2-sentence actionable coaching tip. 
      Sentence 1: Bluntly analyze my strongest and weakest habit. 
      Sentence 2: Give me one specific psychological trick to fix my weakest habit today. Keep it punchy. No markdown formatting.`;

      const { data, error } = await supabase.functions.invoke('ai-chat', { body: { prompt } });
      if (error) throw error;
      
      setAiResponse(data.reply);
    } catch (error) {
      console.error("AI Coach Error:", error);
      // 3. Refund if the AI crashes!
      const refundBalance = (profile?.credits_balance || 0) + COACH_COST;
      setProfile({ ...profile, credits_balance: refundBalance });
      await supabase.from('profiles').update({ credits_balance: refundBalance }).eq('id', user.id);
      setAiResponse("⚠️ The AI Coach is currently meditating. Your credits have been refunded.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (habits.length === 0) return null;

  return (
    <div className="bg-gradient-to-br from-indigo-900/20 to-purple-900/10 border border-indigo-500/30 rounded-2xl p-6 h-full relative overflow-hidden flex flex-col justify-between shadow-lg">
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-[50px] rounded-full pointer-events-none" />
      
      <div>
        <h3 className="text-slate-100 font-bold text-[15px] flex items-center gap-2 mb-2">
          <span className="text-xl">🤖</span> AI Habit Coach
        </h3>
        <p className="text-[12px] text-indigo-200/60 leading-relaxed mb-4">
          Our AI analyzes your exact streak data to identify failure patterns and provide psychological frameworks to build discipline.
        </p>
      </div>
      
      {!aiResponse && !isAnalyzing && (
        <button onClick={getAdvice} className="w-full py-3 rounded-xl bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/20 text-[12px] font-bold transition-all shadow-sm flex items-center justify-center gap-2 group">
          ✨ Analyze My Patterns <span className="bg-indigo-500/20 px-1.5 py-0.5 rounded text-[10px] text-amber-400 group-hover:bg-indigo-500/30 transition-colors">-{COACH_COST} 🪙</span>
        </button>
      )}
      
      {isAnalyzing && (
        <div className="w-full py-3 rounded-xl bg-indigo-500/5 text-indigo-400 text-[12px] font-bold border border-indigo-500/20 flex items-center justify-center gap-2">
          <div className="w-3 h-3 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
          Analyzing Behavior...
        </div>
      )}

      {aiResponse && (
        <div className="p-4 bg-[#0d0d14]/80 border border-white/10 rounded-xl text-[13px] text-slate-200 leading-relaxed relative animate-[fadeIn_0.5s_ease-out] border-l-2 border-l-indigo-500">
          {aiResponse}
        </div>
      )}
    </div>
  );
}