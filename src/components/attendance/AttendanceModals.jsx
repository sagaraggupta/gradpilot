import React from 'react';
import Modal from '../ui/Modal';

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function AddSubjectModal({ isOpen, onClose, newSubject, setNewSubject, handleAddSubject, isSubmitting, errors, setErrors, toggleDay }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Subject">
      <form onSubmit={handleAddSubject} className="flex flex-col gap-5">
        <div>
          <label className="block text-[11px] font-bold text-white/40 uppercase tracking-wider mb-1.5">Subject Name *</label>
          <input type="text" placeholder="e.g., Data Structures" value={newSubject.subject} onChange={e => { setNewSubject({...newSubject, subject: e.target.value}); setErrors({...errors, subject: null}); }} className={`w-full bg-[#0d0d14] border rounded-xl px-4 py-3 text-slate-200 text-[13px] outline-none transition-colors ${errors.subject ? 'border-red-500/50 focus:border-red-500/50' : 'border-white/10 focus:border-indigo-500/50'}`} />
          {errors.subject && <span className="text-[11px] text-red-400 mt-1 block">{errors.subject}</span>}
        </div>

        <div>
          <label className="block text-[11px] font-bold text-white/40 uppercase tracking-wider mb-2">Class Days (Optional)</label>
          <div className="flex gap-1.5 w-full">
            {WEEKDAYS.map(day => (
              <button key={day} type="button" onClick={() => toggleDay(day, newSubject, setNewSubject)} className={`flex-1 py-2 rounded-lg text-[11px] font-bold transition-all duration-200 ${newSubject.days?.includes(day) ? 'bg-indigo-500/20 border border-indigo-500/50 text-indigo-300 shadow-md' : 'bg-[#0d0d14] border border-white/10 text-white/30 hover:bg-white/5 hover:text-white/60'}`}>{day.charAt(0)}</button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-bold text-white/40 uppercase tracking-wider mb-1.5">Classes Attended</label>
            <input type="number" min="0" value={newSubject.present} onChange={e => setNewSubject({...newSubject, present: e.target.value})} className="w-full bg-[#0d0d14] border border-white/10 rounded-xl px-4 py-3 text-slate-200 text-[13px] outline-none focus:border-indigo-500/50" />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-white/40 uppercase tracking-wider mb-1.5">Total Classes</label>
            <input type="number" min="0" value={newSubject.total} onChange={e => setNewSubject({...newSubject, total: e.target.value})} className="w-full bg-[#0d0d14] border border-white/10 rounded-xl px-4 py-3 text-slate-200 text-[13px] outline-none focus:border-indigo-500/50" />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-white/40 uppercase tracking-wider mb-1.5">Target Percentage (%) *</label>
          <input type="number" min="1" max="100" value={newSubject.required} onChange={e => { setNewSubject({...newSubject, required: e.target.value}); setErrors({...errors, required: null}); }} className={`w-full bg-[#0d0d14] border rounded-xl px-4 py-3 text-slate-200 text-[13px] outline-none transition-colors ${errors.required ? 'border-red-500/50' : 'border-white/10 focus:border-indigo-500/50'}`} />
          {errors.required && <span className="text-[11px] text-red-400 mt-1 block">{errors.required}</span>}
        </div>

        <button type="submit" disabled={isSubmitting} className="w-full mt-2 bg-gradient-to-br from-indigo-500 to-purple-500 text-white font-bold text-[13px] py-3.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50">
          {isSubmitting ? "Saving..." : "Add Subject"}
        </button>
      </form>
    </Modal>
  );
}

export function EditSubjectModal({ isOpen, onClose, editSubject, setEditSubject, handleUpdateSubject, handleDeleteSubject, isSubmitting, errors, setErrors, toggleDay }) {
  if (!editSubject) return null;
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Subject">
      <form onSubmit={handleUpdateSubject} className="flex flex-col gap-5">
        <div>
          <label className="block text-[11px] font-bold text-white/40 uppercase tracking-wider mb-1.5">Subject Name</label>
          <input type="text" value={editSubject.subject} onChange={e => { setEditSubject({...editSubject, subject: e.target.value}); setErrors({...errors, subject: null}); }} className={`w-full bg-[#0d0d14] border rounded-xl px-4 py-3 text-slate-200 text-[13px] outline-none transition-colors ${errors.subject ? 'border-red-500/50' : 'border-white/10 focus:border-amber-500/50'}`} />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-white/40 uppercase tracking-wider mb-2">Class Days</label>
          <div className="flex gap-1.5 w-full">
            {WEEKDAYS.map(day => (
              <button key={day} type="button" onClick={() => toggleDay(day, editSubject, setEditSubject)} className={`flex-1 py-2 rounded-lg text-[11px] font-bold transition-all duration-200 ${editSubject.days?.includes(day) ? 'bg-amber-500/20 border border-amber-500/50 text-amber-400 shadow-md' : 'bg-[#0d0d14] border border-white/10 text-white/30 hover:bg-white/5'}`}>{day.charAt(0)}</button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
             <label className="block text-[11px] font-bold text-white/40 uppercase tracking-wider mb-2">Classes Attended</label>
             <div className="flex items-center gap-3">
               <button type="button" onClick={() => setEditSubject({...editSubject, present: Math.max(0, editSubject.present - 1)})} className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 font-bold">-</button>
               <input type="number" min="0" value={editSubject.present} onChange={e => setEditSubject({...editSubject, present: e.target.value})} className="flex-1 bg-[#0d0d14] border border-white/10 rounded-xl px-3 py-2.5 text-center text-slate-200 text-[15px] font-bold outline-none" />
               <button type="button" onClick={() => setEditSubject({...editSubject, present: editSubject.present + 1})} className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 font-bold">+</button>
             </div>
          </div>
          <div>
             <label className="block text-[11px] font-bold text-white/40 uppercase tracking-wider mb-2">Total Classes</label>
             <div className="flex items-center gap-3">
               <button type="button" onClick={() => setEditSubject({...editSubject, total: Math.max(0, editSubject.total - 1)})} className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 font-bold">-</button>
               <input type="number" min="0" value={editSubject.total} onChange={e => setEditSubject({...editSubject, total: e.target.value})} className="flex-1 bg-[#0d0d14] border border-white/10 rounded-xl px-3 py-2.5 text-center text-slate-200 text-[15px] font-bold outline-none" />
               <button type="button" onClick={() => setEditSubject({...editSubject, total: editSubject.total + 1})} className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 font-bold">+</button>
             </div>
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-white/40 uppercase tracking-wider mb-1.5">Target Percentage (%)</label>
          <input type="number" min="1" max="100" value={editSubject.required} onChange={e => { setEditSubject({...editSubject, required: e.target.value}); setErrors({...errors, required: null}); }} className={`w-full bg-[#0d0d14] border rounded-xl px-4 py-3 text-slate-200 text-[13px] outline-none transition-colors ${errors.required ? 'border-red-500/50' : 'border-white/10 focus:border-amber-500/50'}`} />
        </div>

        <div className="flex gap-3 mt-4">
          <button type="button" onClick={() => handleDeleteSubject(editSubject.id)} className="px-5 py-3.5 rounded-xl bg-red-500/10 text-red-400 text-[13px] font-bold hover:bg-red-500/20 transition-colors">Delete</button>
          <button type="submit" disabled={isSubmitting} className="flex-1 bg-gradient-to-br from-amber-500 to-orange-500 text-white font-bold text-[13px] py-3.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50">Save Changes</button>
        </div>
      </form>
    </Modal>
  );
}