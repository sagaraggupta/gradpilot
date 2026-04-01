import React from 'react';
import { Icon, Icons } from '../ui/Icon';

export default function SemesterTranscript({
  semestersList, selectedSemester, setSelectedSemester, 
  sgpa, loading, currentSemesterGrades, GRADE_SCALE, handleDelete
}) {
  return (
    <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col h-full min-h-[500px]">
      
      {/* Semester Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-4 border-b border-white/5 no-scrollbar">
        {semestersList.map(sem => (
          <button 
            key={sem} onClick={() => setSelectedSemester(sem)}
            className={`px-4 py-2 rounded-xl text-[13px] font-bold whitespace-nowrap transition-all duration-200 ${selectedSemester === sem ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'bg-transparent text-white/40 hover:text-white/70 hover:bg-white/5 border border-transparent'}`}
          >
            {sem}
          </button>
        ))}
      </div>

      <div className="flex justify-between items-end mb-4">
        <div>
          <h3 className="text-slate-100 font-semibold text-[16px]">{selectedSemester} Courses</h3>
          <p className="text-[12px] text-white/40 mt-0.5">SGPA: <span className="font-bold text-indigo-400">{sgpa}</span></p>
        </div>
      </div>

      {/* Courses List */}
      <div className="flex-1 overflow-y-auto pr-2 -mr-2">
        {loading ? (
          <div className="text-white/40 text-[13px] py-10 text-center">Loading grades...</div>
        ) : currentSemesterGrades.length === 0 ? (
          <div className="text-white/30 text-[13px] py-16 text-center border border-dashed border-white/10 rounded-xl flex flex-col items-center gap-3">
            <span className="text-3xl">📚</span>
            No courses logged for this semester.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {currentSemesterGrades.map((g) => {
              const scale = GRADE_SCALE[g.grade];
              return (
                <div key={g.id} className="flex justify-between items-center py-3.5 px-4 bg-[#0d0d14] border border-white/5 rounded-xl group hover:border-white/10 transition-colors">
                  <div>
                    <div className="text-[14px] text-slate-200 font-bold">{g.subject}</div>
                    <div className="text-[11px] text-white/40 mt-1 flex items-center gap-2">
                      <span>{g.credits} Credits</span>
                      <span>•</span>
                      <span>{scale.points} Points</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-[20px] font-extrabold tracking-tight leading-none" style={{ color: scale.color }}>{g.grade}</div>
                      <div className="text-[9px] uppercase tracking-widest mt-1" style={{ color: `${scale.color}80` }}>{scale.label}</div>
                    </div>
                    <button onClick={() => handleDelete(g.id)} className="w-8 h-8 rounded-lg bg-red-500/10 text-red-400 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all hover:bg-red-500/20" title="Remove">
                      <Icon d={Icons.x} size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}