import React from 'react';
import ProgressBar from '../ui/ProgressBar';
import { Icon, Icons } from '../ui/Icon';

export default function SubjectCard({ 
  subject: a, 
  markAttendance, 
  updatingIds, 
  onEdit 
}) {
  const pct = a.total > 0 ? Math.round((a.present / a.total) * 100) : 0;
  const isOk = a.total === 0 || pct >= a.required;
  const need = (!isOk && a.total > 0) ? Math.ceil((a.required * a.total - a.present * 100) / (100 - a.required)) : 0;
  const canSkip = (isOk && a.total > 0 && a.present > 0) ? Math.floor((a.present * 100) / a.required - a.total) : 0;

  return (
    <div className="bg-[#0d0d14] border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-colors">
      
      {/* Subject Header & Settings */}
      <div className="flex justify-between items-start mb-4">
        <div className="min-w-0 pr-4">
          <h4 className="text-[15px] text-slate-100 font-bold truncate">{a.subject}</h4>
          <div className="text-[11px] text-white/40 mt-1 flex gap-2 items-center flex-wrap">
            <span>Target: {a.required}%</span>
            <span>•</span>
            <span>Attended: {a.present}/{a.total}</span>
            {a.days && a.days.length > 0 && (
              <>
                <span>•</span>
                <span className="text-indigo-300 bg-indigo-500/10 px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider">
                  {a.days.join(", ")}
                </span>
              </>
            )}
          </div>
        </div>
        <div className="flex gap-3 items-center shrink-0">
          <div className="text-right">
            <span className={`text-[22px] font-extrabold tracking-tight leading-none ${isOk ? 'text-green-400' : 'text-red-400'}`}>{pct}%</span>
            {!isOk && a.total > 0 && <div className="text-[10px] font-bold text-red-400 mt-1 bg-red-400/10 px-2 py-0.5 rounded-full inline-block">Need {need} more</div>}
            {isOk && canSkip > 0 && <div className="text-[10px] font-bold text-green-400 mt-1 bg-green-400/10 px-2 py-0.5 rounded-full inline-block">Can skip {canSkip}</div>}
            {isOk && canSkip === 0 && a.total > 0 && <div className="text-[10px] font-bold text-amber-400 mt-1 bg-amber-400/10 px-2 py-0.5 rounded-full inline-block">0 skips left</div>}
          </div>
          <button 
            onClick={() => onEdit(a)}
            className="w-8 h-8 rounded-lg bg-white/5 text-white/40 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors ml-2 shrink-0"
            title="Edit Settings"
          >
            <Icon d={Icons.settings} size={15} />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative mb-5">
        <ProgressBar value={pct} color={isOk ? "#4ade80" : "#f87171"} height={12} />
        <div className="absolute top-[-4px] bottom-[-4px] w-[3px] bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.8)] z-10" style={{ left: `${a.required}%` }} title={`Target: ${a.required}%`} />
      </div>

      {/* Quick Action Buttons */}
      <div className="flex gap-2">
        <button onClick={() => markAttendance(a.id, 'present')} disabled={updatingIds?.has(a.id)} className="flex-1 py-2.5 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 hover:bg-green-500/20 text-[12px] font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50">
          <Icon d={Icons.check} size={14} /> Present
        </button>
        <button onClick={() => markAttendance(a.id, 'absent')} disabled={updatingIds?.has(a.id)} className="flex-1 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 text-[12px] font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50">
          <Icon d={Icons.x} size={14} /> Absent
        </button>
        
        {/* 🚀 NEW: THE UNDO BUTTON (Improvement #6) */}
        <button onClick={() => markAttendance(a.id, 'undo')} disabled={updatingIds?.has(a.id) || a.total === 0} className="w-10 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors disabled:opacity-20" title="Undo Last Click">
          ↺
        </button>
      </div>
    </div>
  );
}