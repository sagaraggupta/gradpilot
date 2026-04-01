import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function AIAcademicAdvisor({ cgpa, grades }) {
  const [aiResponse, setAiResponse] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const getAdvice = async () => {
    setIsAnalyzing(true);
    try {
      const failedCount = grades.filter(g => g.grade === 'F').length;
      const totalSubjects = grades.length;
      
      const prompt = `Act as a strict but highly strategic academic advisor for an engineering student. 
      My Current CGPA: ${cgpa}. 
      Total Subjects Logged: ${totalSubjects}. 
      Total Failed Subjects (KTs): ${failedCount}. 
      Give me a 2-sentence highly actionable academic strategy. 
      Sentence 1: Analyze my current standing bluntly. 
      Sentence 2: Give me one specific, high-leverage tip for my next semester. Keep it punchy. No markdown formatting.`;

      const { data, error } = await supabase.functions.invoke('ai-chat', { body: { prompt } });
      if (error) throw error;
      
      setAiResponse(data.reply);
    } catch (error) {
      console.error("AI Advisor Error:", error);
      setAiResponse("The AI Advisor is currently busy helping other students. Please try again later.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-blue-900/20 to-indigo-900/20 border border-blue-500/30 rounded-2xl p-6 mt-5 relative overflow-hidden shadow-lg">
      <div className="absolute top-0 left-0 w-32 h-32 bg-blue-500/10 blur-[50px] rounded-full pointer-events-none" />
      
      <div className="relative z-10 flex flex-col md:flex-row gap-5 items-start md:items-center justify-between">
        <div>
          <h3 className="text-slate-100 font-bold text-[16px] flex items-center gap-2 mb-1">
            <span className="text-xl">🧠</span> AI Academic Advisor
          </h3>
          <p className="text-[13px] text-blue-200/70 max-w-md leading-relaxed">
            Let our AI analyze your exact transcript and KTs to generate a personalized recovery or acceleration strategy.
          </p>
        </div>
        
        {!aiResponse && !isAnalyzing && (
          <button onClick={getAdvice} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 hover:scale-105 text-white text-[13px] font-bold shadow-lg shadow-blue-500/30 transition-all shrink-0">
            ✨ Generate Strategy
          </button>
        )}
        
        {isAnalyzing && (
          <div className="px-5 py-2.5 rounded-xl bg-blue-500/20 text-blue-300 text-[13px] font-bold border border-blue-500/30 flex items-center gap-2 shrink-0">
            <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
            Analyzing Transcript...
          </div>
        )}
      </div>

      {aiResponse && (
        <div className="mt-5 p-5 bg-[#0d0d14]/80 border border-white/10 rounded-xl text-[14px] text-slate-200 leading-relaxed relative animate-[fadeIn_0.5s_ease-out] border-l-2 border-l-blue-500">
          {aiResponse}
        </div>
      )}
    </div>
  );
}