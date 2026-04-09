import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function AIFocusCoach({ user, profile, setProfile, focusMinutes, sessionsToday, currentStreak }) {
  const [aiResponse, setAiResponse] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const COACH_COST = 15; // Set the premium cost here!

  const getCoachAdvice = async () => {
    // 1. Check if they can afford it
    if (!profile || (profile.credits_balance || 0) < COACH_COST) {
      alert(`You need ${COACH_COST} 🪙 Credits to use the AI Coach. Complete a session to earn more!`);
      return;
    }

    setIsAnalyzing(true);
    try {
      // 2. Optimistically deduct credits for snappy UI
      const newBalance = profile.credits_balance - COACH_COST;
      setProfile({ ...profile, credits_balance: newBalance });
      await supabase.from('profiles').update({ credits_balance: newBalance }).eq('id', user.id);

      const prompt = `Act as a high-performance productivity coach. 
      My stats today: ${focusMinutes} minutes focused across ${sessionsToday} sessions. 
      My current daily streak is ${currentStreak} days.
      Give me a 2-sentence highly motivational analysis of my focus today. 
      Sentence 1: Analyze my stats. 
      Sentence 2: Give me a specific, actionable productivity tip for my next session. Keep it punchy. No markdown.`;

      const { data, error } = await supabase.functions.invoke('ai-chat', { body: { prompt } });
      if (error) throw error;
      
      setAiResponse(data.reply);
    } catch (error) {
      console.error(error);
      // 3. Refund if the AI fails!
      const refundBalance = (profile?.credits_balance || 0) + COACH_COST;
      setProfile({ ...profile, credits_balance: refundBalance });
      await supabase.from('profiles').update({ credits_balance: refundBalance }).eq('id', user.id);
      
      setAiResponse("⚠️ Connection failed. Your credits have been refunded.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="w-full max-w-[650px] mt-6 bg-gradient-to-br from-[#0d0d14] to-indigo-900/10 border border-indigo-500/20 rounded-2xl p-5 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-[50px] rounded-full pointer-events-none"></div>
      
      <div className="relative z-10 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-3 text-center sm:text-left">
          <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-xl border border-indigo-500/30 shrink-0">🤖</div>
          <div>
            <h4 className="text-[14px] font-bold text-slate-200">AI Focus Coach</h4>
            <p className="text-[11px] text-indigo-300/70">Personalized insights based on your sessions.</p>
          </div>
        </div>

        {!aiResponse && !isAnalyzing && (
          <button 
            onClick={getCoachAdvice} 
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/30 hover:bg-indigo-500/20 hover:border-indigo-500/50 text-[12px] font-bold text-indigo-300 transition-all shadow-md group"
          >
            <span>Get Daily Insight</span>
            <span className="bg-indigo-500/20 px-1.5 py-0.5 rounded text-[10px] text-amber-400 group-hover:bg-indigo-500/30 transition-colors">-{COACH_COST} 🪙</span>
          </button>
        )}
        
        {isAnalyzing && (
          <div className="text-[12px] text-indigo-400 font-bold flex items-center gap-2">
            <div className="w-3 h-3 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            Analyzing Flow State...
          </div>
        )}
      </div>

      {aiResponse && (
        <div className="mt-4 p-4 bg-black/20 border border-white/5 rounded-xl text-[13px] text-slate-300 leading-relaxed border-l-2 border-l-indigo-500 animate-[fadeIn_0.5s_ease-out]">
          {aiResponse}
        </div>
      )}
    </div>
  );
}