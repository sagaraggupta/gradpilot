import React from 'react';
import Modal from '../ui/Modal';

export default function AddGradeModal({
  isOpen, onClose, handleAddGrade, newGrade, setNewGrade, 
  errors, setErrors, isSubmitting, GRADE_SCALE
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Log Course Grade">
      <form onSubmit={handleAddGrade} className="flex flex-col gap-5">
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-bold text-white/40 uppercase tracking-wider mb-1.5">Semester *</label>
            <select 
              value={newGrade.semester} onChange={e => setNewGrade({...newGrade, semester: e.target.value})}
              className="w-full bg-[#0d0d14] border border-white/10 rounded-xl px-4 py-3 text-slate-200 text-[13px] outline-none focus:border-indigo-500/50 appearance-none"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                <option key={num} value={`Semester ${num}`} className="bg-[#0d0d14]">Semester {num}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-white/40 uppercase tracking-wider mb-1.5">Credits *</label>
            <select 
              value={newGrade.credits} onChange={e => setNewGrade({...newGrade, credits: Number(e.target.value)})}
              className="w-full bg-[#0d0d14] border border-white/10 rounded-xl px-4 py-3 text-slate-200 text-[13px] outline-none focus:border-indigo-500/50 appearance-none"
            >
              {[1, 2, 3, 4, 5].map(num => (
                <option key={num} value={num} className="bg-[#0d0d14]">{num} Credits</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-white/40 uppercase tracking-wider mb-1.5">Subject Name *</label>
          <input 
            type="text" placeholder="e.g. Engineering Mechanics"
            value={newGrade.subject} onChange={e => { setNewGrade({...newGrade, subject: e.target.value}); setErrors({...errors, subject: null}); }}
            className={`w-full bg-[#0d0d14] border rounded-xl px-4 py-3 text-slate-200 text-[13px] outline-none transition-colors ${errors.subject ? 'border-red-500/50 focus:border-red-500/50' : 'border-white/10 focus:border-indigo-500/50'}`}
          />
          {errors.subject && <span className="text-[11px] text-red-400 mt-1 block">{errors.subject}</span>}
        </div>

        <div>
          <label className="block text-[11px] font-bold text-white/40 uppercase tracking-wider mb-2">Grade Achieved *</label>
          <div className="grid grid-cols-4 gap-2">
            {Object.entries(GRADE_SCALE).map(([grade, config]) => (
              <button 
                key={grade} type="button" onClick={() => setNewGrade({...newGrade, grade})}
                className={`py-2 rounded-xl border flex flex-col items-center justify-center transition-all duration-200
                  ${newGrade.grade === grade 
                    ? 'bg-indigo-500/20 border-indigo-500/50 text-white shadow-md scale-105' 
                    : 'bg-[#0d0d14] border-white/10 text-white/40 hover:bg-white/5 hover:text-white/70'}`}
                style={newGrade.grade === grade ? { color: config.color, borderColor: config.color } : {}}
              >
                <span className="text-[14px] font-extrabold">{grade}</span>
                <span className="text-[9px] font-medium opacity-70 truncate w-full px-1 text-center" title={config.label}>
                  {config.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        <button type="submit" disabled={isSubmitting} className="w-full mt-2 bg-gradient-to-br from-indigo-500 to-purple-500 text-white font-bold text-[13px] py-3.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 shadow-lg shadow-indigo-500/20">
          {isSubmitting ? "Saving..." : "Log Grade"}
        </button>
      </form>
    </Modal>
  );
}