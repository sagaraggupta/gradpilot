import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function AIDecisionEngine({ analyticsData }) {
  const [aiInsights, setAiInsights] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const generateCorrelations = async () => {
    if (!analyticsData) return;
    setIsAnalyzing(true);
    
    try {
      const prompt = `Act as an elite data scientist and behavioral coach for a university student.
      Here is their current dashboard data:
      - CGPA: ${analyticsData.cgpa}
      - Total Focus Hours: ${analyticsData.focusHours}
      - Monthly Spend: ₹${analyticsData.spentThisMonth} (Budget: ₹${analyticsData.budget})
      - Productivity Score: ${Math.round(analyticsData.scores.Productivity)}/100
      - Consistency Score: ${Math.round(analyticsData.scores.Consistency)}/100

      Task 1: Find 1 hidden correlation between their habits, focus, and grades/spending (e.g., "Your high focus time correlates with your strong CGPA").
      Task 2: Provide exactly 3 highly actionable recommendations.
      
      Format EXACTLY like this (3 lines, separated by the | character). No intro, no markdown.
      icon|insight text|type
      
      Example:
      ⚠️|Your 40% productivity drop correlates with low focus hours. Block 1 hour tonight.|warning
      🌟|Excellent budget management! This financial discipline correlates with your strong consistency.|success
      `;

      const { data, error } = await supabase.functions.invoke('ai-chat', { body: { prompt } });
      if (error) throw error;
      
      // Parse the strict format into an array of objects
      const parsedPlan = data.reply.trim().split('\n')
        .filter(line => line.includes('|'))
        .map(line => {
          const [icon, text, type] = line.split('|');
          return { icon: icon || '⚡', text: text || line, type: type?.trim() || 'success' };
        });
        
      setAiInsights(parsedPlan);
    } catch (error) {
      console.error("AI Engine Error:", error);
      setAiInsights([{ icon: "❌", text: "Neural link offline. Please try again.", type: "urgent" }]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-indigo-900/20 to-purple-900/10 border border-indigo-500/30 rounded-3xl p-6 relative overflow-hidden mt-6 shadow-xl">
      <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 blur-[60px] rounded-full pointer-events-none" />
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-5 relative z-10">
        <div>
          <h3 className="text-slate-100 font-semibold text-[16px] flex items-center gap-2">
            <span className="text-indigo-400">🧠</span> AI Decision Engine
          </h3>
          <p className="text-[12px] text-indigo-200/60 mt-1">Cross-correlating your habits, focus time, and finances.</p>
        </div>
        
        {!aiInsights && !isAnalyzing && (
          <button onClick={generateCorrelations} className="px-5 py-2.5 rounded-xl bg-indigo-500 text-white text-[12px] font-bold shadow-lg shadow-indigo-500/30 hover:scale-105 transition-all shrink-0">
            ✨ Generate Deep Insights
          </button>
        )}
        
        {isAnalyzing && (
          <div className="px-5 py-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 text-[12px] font-bold border border-indigo-500/30 flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
            Processing Neural Models...
          </div>
        )}
      </div>

      {aiInsights && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10 animate-[fadeIn_0.5s_ease-out]">
          {aiInsights.map((action, i) => (
            <div key={i} className={`p-4 rounded-2xl border flex flex-col gap-3 items-start shadow-sm bg-[#0d0d14]/80 backdrop-blur-sm ${
              action.type === 'urgent' ? 'border-red-500/40 text-red-200' :
              action.type === 'warning' ? 'border-amber-500/40 text-amber-200' : 'border-emerald-500/40 text-emerald-200'
            }`}>
              <div className="text-3xl drop-shadow-md">{action.icon}</div>
              <div className="text-[13px] font-medium leading-relaxed">{action.text}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}