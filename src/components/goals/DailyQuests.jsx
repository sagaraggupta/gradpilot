import React from 'react';
import ProgressBar from '../ui/ProgressBar';

export default function DailyQuests({ habitsDoneToday, highestStreak, goalsCompleted }) {
  const quests = [
    { 
      id: 1, title: "Daily Discipline", desc: "Complete 3 habits today", 
      current: Math.min(habitsDoneToday, 3), target: 3, credits: 50, icon: "📚", color: "#4ade80" 
    },
    { 
      id: 2, title: "Momentum Builder", desc: "Maintain a 3-day habit streak", 
      current: Math.min(highestStreak, 3), target: 3, credits: 100, icon: "🔥", color: "#fb923c" 
    },
    { 
      id: 3, title: "Executioner", desc: "Complete 1 personal goal", 
      current: Math.min(goalsCompleted, 1), target: 1, credits: 200, icon: "🎯", color: "#a855f7" 
    }
  ];

  return (
    <div className="bg-gradient-to-br from-indigo-900/20 to-purple-900/10 border border-indigo-500/20 rounded-2xl p-6 animate-[fadeIn_0.4s_ease-out]">
      <div className="flex justify-between items-center mb-5">
        <div>
          <h3 className="text-slate-100 font-bold text-[16px] flex items-center gap-2">
            <span className="text-xl">📜</span> Daily Quests
          </h3>
          <p className="text-[12px] text-indigo-300/70 mt-1">Complete these to earn bonus Credits automatically.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {quests.map(quest => {
          const isComplete = quest.current >= quest.target;
          const progressPct = (quest.current / quest.target) * 100;
          
          return (
            <div key={quest.id} className={`relative overflow-hidden rounded-xl border p-4 transition-all ${isComplete ? 'bg-[#0d0d14] border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.1)]' : 'bg-white/5 border-white/10'}`}>
              {isComplete && <div className="absolute -right-4 -top-4 w-16 h-16 bg-indigo-500/20 rotate-45 blur-xl pointer-events-none" />}
              
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-[#0d0d14] border border-white/5 flex items-center justify-center text-xl shrink-0">{quest.icon}</div>
                <div>
                  <div className={`text-[13px] font-bold ${isComplete ? 'text-indigo-400' : 'text-slate-200'}`}>{quest.title}</div>
                  <div className="text-[10px] text-white/50 mt-0.5 leading-tight">{quest.desc}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1"><ProgressBar value={progressPct} color={isComplete ? quest.color : "#6366f1"} height={6} /></div>
                <div className="text-[11px] font-bold text-white/40 shrink-0">{quest.current} / {quest.target}</div>
              </div>

              {isComplete ? (
                <div className="mt-3 w-full py-1.5 rounded border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 text-[10px] font-bold text-center uppercase tracking-widest">
                  Completed +{quest.credits} 🪙
                </div>
              ) : (
                <div className="mt-3 w-full py-1.5 rounded border border-white/5 bg-black/20 text-white/30 text-[10px] font-bold text-center uppercase tracking-widest">
                  Reward: {quest.credits} 🪙
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}