import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

export default function AIFinancialCoach({ categoryTotals, monthlyBudget, totalSpent }) {
  const { user } = useAuth(); // 🚀 Needed to fetch and update credits!
  const [aiResponse, setAiResponse] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [localError, setLocalError] = useState(null);

  const runAudit = async () => {
    if (!user?.id) return;
    setIsAnalyzing(true);
    setLocalError(null);

    try {
      // 🪙 1. CHECK WALLET BALANCE
      const { data: profile } = await supabase
        .from('profiles')
        .select('credits_balance')
        .eq('id', user.id)
        .single();

      const currentCredits = profile?.credits_balance || 0;

      if (currentCredits < 100) {
        setLocalError("Not enough Credits! You need 100 🪙 to run an AI audit.");
        setIsAnalyzing(false);
        return;
      }

      // 🪙 2. DEDUCT THE FEE (100 Credits)
      const newBalance = currentCredits - 100;
      const { error: paymentError } = await supabase
        .from('profiles')
        .update({ credits_balance: newBalance })
        .eq('id', user.id);

      if (paymentError) throw new Error("Payment transaction failed.");

      // 🧠 3. RUN THE AI PROMPT
      const prompt = `Act as a strict, highly analytical financial advisor for a college student. 
      My Monthly Budget: ₹${monthlyBudget}. 
      Total Spent This Month: ₹${totalSpent}. 
      Category Breakdown: ${JSON.stringify(categoryTotals)}. 
      Give me a 3-sentence financial audit. 
      Sentence 1: Analyze my current standing. 
      Sentence 2: Call out my biggest waste of money strictly based on the categories. 
      Sentence 3: Give me one punchy, actionable tip to save money for the rest of the month. Do not use markdown formatting.`;

      const { data, error } = await supabase.functions.invoke('ai-chat', { body: { prompt } });
      
      if (error) throw error;
      
      setAiResponse(data.reply);
    } catch (error) {
      console.error("AI Coach Error:", error);
      setLocalError("The AI servers are resting, or a network error occurred. Try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-indigo-900/40 to-purple-900/20 border border-indigo-500/30 rounded-2xl p-6 relative overflow-hidden mt-5 shadow-[0_0_30px_rgba(99,102,241,0.1)]">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/20 blur-[60px] rounded-full pointer-events-none"></div>
      
      <div className="relative z-10 flex flex-col md:flex-row gap-5 items-start md:items-center justify-between">
        <div>
          <h3 className="text-slate-100 font-bold text-[16px] flex items-center gap-2 mb-1">
            <span className="text-xl">🤖</span> AI Financial Coach
          </h3>
          <p className="text-[13px] text-indigo-200/70 max-w-md leading-relaxed">
            Spend 100 🪙 to have our AI analyze your specific spending habits, find hidden leaks, and suggest personalized ways to save.
          </p>
        </div>
        
        {!aiResponse && !isAnalyzing && (
          <button onClick={runAudit} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 hover:scale-105 text-white text-[13px] font-bold shadow-lg shadow-indigo-500/30 transition-all shrink-0 flex items-center gap-2">
            ✨ Run Custom Audit <span className="text-amber-300 bg-black/20 px-1.5 py-0.5 rounded-md border border-amber-500/30">100 🪙</span>
          </button>
        )}
        
        {isAnalyzing && (
          <div className="px-5 py-2.5 rounded-xl bg-indigo-500/20 text-indigo-300 text-[13px] font-bold border border-indigo-500/30 flex items-center gap-2 shrink-0">
            <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
            Analyzing Spending...
          </div>
        )}
      </div>

      {localError && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-[13px] rounded-lg font-bold">
          {localError}
        </div>
      )}

      {aiResponse && (
        <div className="mt-5 p-5 bg-[#0d0d14]/60 border border-white/10 rounded-xl text-[14px] text-slate-200 leading-relaxed relative animate-[fadeIn_0.5s_ease-out]">
          <div className="absolute top-2 right-4 text-[40px] text-white/5 font-serif leading-none">"</div>
          {aiResponse}
        </div>
      )}
    </div>
  );
}