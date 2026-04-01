import React from 'react';

export default function TodaySchedule({ subjects }) {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const todayStr = days[new Date().getDay()];
  
  // Find classes scheduled for today
  const todaysClasses = subjects.filter(s => s.days?.includes(todayStr));

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 h-full flex flex-col">
      <h3 className="text-slate-100 font-bold text-[16px] mb-6 flex items-center gap-2">
        📅 Today's Schedule <span className="text-white/40 text-[12px] font-normal">({todayStr})</span>
      </h3>
      
      {todaysClasses.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-center py-6 border border-dashed border-white/10 rounded-xl bg-white/[0.02] text-white/40 text-[13px]">
          No classes scheduled for today.<br/>Enjoy your free time! 🏖️
        </div>
      ) : (
        <div className="flex flex-col gap-0 flex-1">
          {todaysClasses.map((c, i) => {
            const isLast = i === todaysClasses.length - 1;
            const pct = c.total > 0 ? Math.round((c.present / c.total) * 100) : 0;
            const isRisk = pct < c.required;

            return (
              <div key={c.id} className="flex gap-4 min-h-[70px]">
                {/* Timeline Line & Dot */}
                <div className="flex flex-col items-center">
                  <div className={`w-3.5 h-3.5 rounded-full z-10 ${isRisk ? 'bg-red-500 shadow-[0_0_10px_rgba(248,113,113,0.5)]' : 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]'}`}></div>
                  {!isLast && <div className="w-[2px] flex-1 bg-white/10 my-1 rounded-full"></div>}
                </div>
                
                {/* Timeline Content */}
                <div className={`flex-1 bg-[#0d0d14] border border-white/5 p-3.5 rounded-xl ${isLast ? '' : 'mb-4'} hover:border-white/10 transition-colors`}>
                  <div className="text-[14px] font-bold text-slate-200">{c.subject}</div>
                  <div className="text-[11px] mt-1 flex gap-2">
                    <span className="text-white/40">Target: {c.required}%</span>
                    <span className="text-white/20">•</span>
                    <span className={isRisk ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}>
                      Current: {pct}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}