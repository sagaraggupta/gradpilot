import React, { useMemo } from 'react';

export default function KTTracker({ grades }) {
  const { activeKTs, clearedKTs } = useMemo(() => {
    if (!grades) return { activeKTs: [], clearedKTs: [] };

    const failed = grades.filter(g => g.grade === 'F');
    const active = [];
    const cleared = [];

    failed.forEach(failRecord => {
      // Check if the user passed this exact subject in another semester
      const passRecord = grades.find(g => 
        g.subject.toLowerCase().trim() === failRecord.subject.toLowerCase().trim() && 
        g.grade !== 'F' && 
        g.id !== failRecord.id
      );

      if (passRecord) {
        cleared.push({ failed: failRecord, passed: passRecord });
      } else {
        active.push(failRecord);
      }
    });

    return { activeKTs: active, clearedKTs: cleared };
  }, [grades]);

  if (activeKTs.length === 0 && clearedKTs.length === 0) return null;

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mt-5 animate-[fadeIn_0.5s_ease-out]">
      <h3 className="text-slate-100 font-bold text-[16px] mb-5 flex items-center gap-2">
        <span className="text-xl">🚨</span> Backlog & KT Tracking
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* ACTIVE KTs */}
        <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
          <h4 className="text-[12px] font-bold text-red-400 uppercase tracking-wider mb-3 flex justify-between">
            Active Backlogs <span>{activeKTs.length}</span>
          </h4>
          {activeKTs.length === 0 ? (
            <div className="text-white/40 text-[12px] italic">No active KTs! Keep it up.</div>
          ) : (
            <div className="flex flex-col gap-2">
              {activeKTs.map(kt => (
                <div key={kt.id} className="flex justify-between items-center bg-[#0d0d14] border border-red-500/20 p-3 rounded-lg">
                  <div>
                    <div className="text-[13px] font-bold text-slate-200">{kt.subject}</div>
                    <div className="text-[11px] text-white/40">{kt.semester}</div>
                  </div>
                  <span className="text-[15px] font-extrabold text-red-400">F</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* CLEARED KTs */}
        <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-4">
          <h4 className="text-[12px] font-bold text-green-400 uppercase tracking-wider mb-3 flex justify-between">
            Cleared Backlogs <span>{clearedKTs.length}</span>
          </h4>
          {clearedKTs.length === 0 ? (
            <div className="text-white/40 text-[12px] italic">No cleared KTs yet.</div>
          ) : (
            <div className="flex flex-col gap-2">
              {clearedKTs.map(kt => (
                <div key={kt.failed.id} className="flex justify-between items-center bg-[#0d0d14] border border-green-500/20 p-3 rounded-lg opacity-70 hover:opacity-100 transition-opacity">
                  <div>
                    <div className="text-[13px] font-bold text-slate-200 line-through decoration-red-500/50">{kt.failed.subject}</div>
                    <div className="text-[10px] text-white/40">Failed {kt.failed.semester} → Cleared {kt.passed.semester}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] text-white/30 line-through">F</span>
                    <span className="text-[10px] text-white/30">→</span>
                    <span className="text-[15px] font-extrabold text-green-400">{kt.passed.grade}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}