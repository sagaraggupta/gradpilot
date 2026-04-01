import React from 'react';
import Modal from '../ui/Modal';

export default function TaskModal({
  isOpen,
  onClose,
  editingTaskId,
  handleSaveTask,
  isSubmitting,
  newTask,
  setNewTask,
  errors,
  setErrors,
  showSubjectDropdown,
  setShowSubjectDropdown,
  subjectOptions,
  priorityConfig
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editingTaskId ? "Edit Assignment" : "Create New Assignment"}>
      <form onSubmit={handleSaveTask} className="flex flex-col gap-5">
        <div>
          <label className="block text-[11px] font-bold text-white/40 uppercase tracking-wider mb-1.5">Task Title *</label>
          <input type="text" placeholder="e.g., Thermodynamics Essay" value={newTask.title} onChange={e => { setNewTask({...newTask, title: e.target.value}); setErrors({...errors, title: null}); }} className={`w-full bg-[#0d0d14] border rounded-xl px-4 py-3 text-slate-200 text-[13px] font-bold outline-none transition-colors ${errors.title ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-indigo-500/50'}`} />
          {errors.title && <span className="text-[11px] font-bold text-red-400 mt-1 block">{errors.title}</span>}
        </div>
        
        <div className="relative">
          <label className="block text-[11px] font-bold text-white/40 uppercase tracking-wider mb-1.5">Subject *</label>
          <input type="text" placeholder="Select or type subject" value={newTask.subject} onFocus={() => setShowSubjectDropdown(true)} onBlur={() => setTimeout(() => setShowSubjectDropdown(false), 200)} onChange={e => { setNewTask({...newTask, subject: e.target.value}); setErrors({...errors, subject: null}); }} className={`w-full bg-[#0d0d14] border rounded-xl px-4 py-3 text-slate-200 text-[13px] font-bold outline-none transition-colors ${errors.subject ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-indigo-500/50'}`} />
          {showSubjectDropdown && (
            <div className="absolute z-10 w-full mt-1 bg-[#1a1a24] border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-[fadeIn_0.1s_ease-out]">
              {subjectOptions.filter(s => s.toLowerCase().includes(newTask.subject.toLowerCase())).map(option => (
                <div key={option} onMouseDown={() => { setNewTask({...newTask, subject: option}); setShowSubjectDropdown(false); setErrors({...errors, subject: null}); }} className="px-4 py-2.5 text-[13px] font-bold text-slate-200 hover:bg-indigo-500/20 hover:text-indigo-300 cursor-pointer transition-colors">{option}</div>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-bold text-white/40 uppercase tracking-wider mb-1.5">Due Date *</label>
            <input type="date" value={newTask.date} onChange={e => { setNewTask({...newTask, date: e.target.value}); setErrors({...errors, date: null}); }} className={`w-full bg-[#0d0d14] border rounded-xl px-4 py-3 text-slate-200 text-[13px] font-bold outline-none transition-colors [color-scheme:dark] ${errors.date ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-indigo-500/50'}`} />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-white/40 uppercase tracking-wider mb-1.5">Time (Optional)</label>
            <input type="time" value={newTask.time} onChange={e => setNewTask({...newTask, time: e.target.value})} className="w-full bg-[#0d0d14] border border-white/10 rounded-xl px-4 py-3 text-slate-200 text-[13px] font-bold outline-none focus:border-indigo-500/50 transition-colors [color-scheme:dark]" />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-white/40 uppercase tracking-wider mb-2">Priority Level</label>
          <div className="flex gap-2 p-1 bg-white/5 rounded-xl border border-white/5">
            {Object.entries(priorityConfig).map(([key, config]) => (
              <button key={key} type="button" onClick={() => setNewTask({...newTask, priority: key})} className={`flex-1 py-2 rounded-lg text-xs font-bold capitalize transition-all duration-200 ${newTask.priority === key ? config.colorClass + ' shadow-md' : 'text-white/40 hover:text-white/70'}`}>{config.label}</button>
            ))}
          </div>
        </div>

        <button type="submit" disabled={isSubmitting} className="w-full mt-2 bg-gradient-to-br from-indigo-500 to-purple-500 text-white font-bold text-[14px] py-3.5 rounded-xl hover:opacity-90 shadow-lg">
          {editingTaskId ? "Save Changes" : "Create Task"}
        </button>
      </form>
    </Modal>
  );
}