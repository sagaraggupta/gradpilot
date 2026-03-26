import React, { useState, useEffect } from "react";
import StatCard from "../components/ui/StatCard";
import ProgressBar from "../components/ui/ProgressBar";
import Modal from "../components/ui/Modal";
import { Icon, Icons } from "../components/ui/Icon";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

export default function Attendance() {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  
  // Forms (Now including 'days' array)
  const [newSubject, setNewSubject] = useState({ subject: "", present: 0, total: 0, required: 75, days: [] });
  const [editSubject, setEditSubject] = useState(null);

  const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  useEffect(() => {
      document.title = "Attendance | GradPilot";
    }, []);

  // ─── FETCH DATA ───────────────────────────────────────────────────────────
  useEffect(() => {
    fetchAttendance();
  }, [user]);

  const fetchAttendance = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('user_id', user.id) // 🔒 CRITICAL FIX: Scoped to the user!
      .order('created_at', { ascending: false });

    if (data) setSubjects(data);
    setLoading(false);
  };

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  // ─── DAY PICKER LOGIC ─────────────────────────────────────────────────────
  const toggleDay = (day, state, setState) => {
    const currentDays = state.days || [];
    if (currentDays.includes(day)) {
      setState({ ...state, days: currentDays.filter(d => d !== day) });
    } else {
      setState({ ...state, days: [...currentDays, day] });
    }
  };

  // ─── QUICK ACTIONS (Present / Absent) ──────────────────────────────────────
  const markAttendance = async (id, type) => {
    const subject = subjects.find(s => s.id === id);
    const newTotal = subject.total + 1;
    const newPresent = type === 'present' ? subject.present + 1 : subject.present;

    setSubjects(prev => prev.map(s => s.id === id ? { ...s, total: newTotal, present: newPresent } : s));
    await supabase.from('attendance').update({ total: newTotal, present: newPresent }).eq('id', id).eq('user_id', user.id);
    showToast(`Marked ${type} for ${subject.subject}`);
  };

  // ─── ADD SUBJECT ──────────────────────────────────────────────────────────
  const handleAddSubject = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!newSubject.subject.trim()) newErrors.subject = "Subject name is required.";
    if (newSubject.required < 1 || newSubject.required > 100) newErrors.required = "Target must be between 1% and 100%.";
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    const subjectToInsert = {
      user_id: user.id,
      subject: newSubject.subject,
      present: Number(newSubject.present) || 0,
      total: Number(newSubject.total) || 0,
      required: Number(newSubject.required) || 75,
      days: newSubject.days
    };

    const { data, error } = await supabase.from('attendance').insert([subjectToInsert]).select();
    
    if (!error && data) {
      setSubjects([...subjects, data[0]]);
      setIsAddModalOpen(false);
      setNewSubject({ subject: "", present: 0, total: 0, required: 75, days: [] });
      showToast("Subject added!");
    }
    setIsSubmitting(false);
  };

  // ─── EDIT / DELETE SUBJECT ────────────────────────────────────────────────
  const handleUpdateSubject = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!editSubject.subject.trim()) newErrors.subject = "Subject name is required.";
    if (editSubject.required < 1 || editSubject.required > 100) newErrors.required = "Target must be between 1% and 100%.";
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    const { data, error } = await supabase.from('attendance')
      .update({
        subject: editSubject.subject,
        present: Number(editSubject.present),
        total: Number(editSubject.total),
        required: Number(editSubject.required),
        days: editSubject.days || []
      })
      .eq('id', editSubject.id)
      .eq('user_id', user.id)
      .select();

    if (!error && data) {
      setSubjects(prev => prev.map(s => s.id === editSubject.id ? data[0] : s));
      setIsEditModalOpen(false);
      showToast("Settings updated!");
    }
    setIsSubmitting(false);
  };

  const handleDeleteSubject = async (id) => {
    if (!window.confirm("Are you sure you want to delete this subject?")) return;
    setSubjects(prev => prev.filter(s => s.id !== id));
    await supabase.from('attendance').delete().eq('id', id).eq('user_id', user.id);
    setIsEditModalOpen(false);
    showToast("Subject deleted.");
  };

  // ─── CALCULATIONS ─────────────────────────────────────────────────────────
  const totalClasses = subjects.reduce((acc, curr) => acc + curr.total, 0);
  const totalPresent = subjects.reduce((acc, curr) => acc + curr.present, 0);
  const overallPct = totalClasses > 0 ? Math.round((totalPresent / totalClasses) * 100) : 0;
  
  const subjectsAtRisk = subjects.filter(s => s.total > 0 && Math.round((s.present / s.total) * 100) < s.required).length;

  const statusState = subjects.length === 0 ? "No Data" : (subjectsAtRisk > 0 ? "Warning" : "Safe");
  const statusSub = subjects.length === 0 ? "Add a subject" : (subjectsAtRisk > 0 ? "Need to attend more" : "All targets met!");
  const statusColor = subjects.length === 0 ? "#818cf8" : (subjectsAtRisk > 0 ? "#f87171" : "#4ade80");

  return (
    <div className="flex flex-col gap-5 relative pb-10">
      
      {/* HEADER */}
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h2 className="text-slate-100 font-bold text-[22px] font-['Sora']">Attendance Tracker</h2>
          <p className="text-white/40 text-[13px] mt-0.5">Manage your class targets</p>
        </div>
        <button 
          onClick={() => { setErrors({}); setIsAddModalOpen(true); }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 text-white text-xs font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-indigo-500/20"
        >
          <Icon d={Icons.plus} size={14} /> Add Subject
        </button>
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Overall Attendance" value={`${overallPct}%`} sub="Across all subjects" icon="attendance" color={overallPct >= 75 ? "#4ade80" : "#fbbf24"} />
        <StatCard label="Classes Attended" value={totalPresent} sub={`out of ${totalClasses} total`} icon="book" color="#818cf8" />
        <StatCard label="Subjects at Risk" value={subjectsAtRisk} sub="Below target %" icon="bell" color={subjectsAtRisk > 0 ? "#f87171" : "#4ade80"} />
        <StatCard label="Status" value={statusState} sub={statusSub} icon="zap" color={statusColor} />
      </div>

      {/* SUBJECTS LIST */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mt-2">
        <h3 className="text-slate-100 font-semibold mb-5 text-[15px]">Subject Breakdown</h3>
        
        {loading ? (
          <div className="text-white/40 text-sm flex gap-2 items-center"><div className="w-4 h-4 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" /> Loading attendance...</div>
        ) : subjects.length === 0 ? (
          <div className="text-white/40 text-sm bg-white/5 border border-white/10 border-dashed p-8 rounded-2xl text-center">
            No subjects found. Click "Add Subject" to start tracking!
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {subjects.map((a) => {
              const pct = a.total > 0 ? Math.round((a.present / a.total) * 100) : 0;
              const isOk = a.total === 0 || pct >= a.required;
              const need = (!isOk && a.total > 0) ? Math.ceil((a.required * a.total - a.present * 100) / (100 - a.required)) : 0;
              const canSkip = (isOk && a.total > 0 && a.present > 0) ? Math.floor((a.present * 100) / a.required - a.total) : 0;
              
              return (
                <div key={a.id} className="bg-[#0d0d14] border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-colors">
                  
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
                        {!isOk && a.total > 0 && <div className="text-[10px] font-bold text-red-400 mt-1 bg-red-400/10 px-2 py-0.5 rounded-full inline-block">Need {need} more classes</div>}
                        {isOk && canSkip > 0 && <div className="text-[10px] font-bold text-green-400 mt-1 bg-green-400/10 px-2 py-0.5 rounded-full inline-block">Can skip {canSkip} classes</div>}
                        {isOk && canSkip === 0 && a.total > 0 && <div className="text-[10px] font-bold text-amber-400 mt-1 bg-amber-400/10 px-2 py-0.5 rounded-full inline-block">On track (0 skips left)</div>}
                      </div>
                      <button 
                        onClick={() => { setErrors({}); setEditSubject(a); setIsEditModalOpen(true); }}
                        className="w-8 h-8 rounded-lg bg-white/5 text-white/40 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors ml-2 shrink-0"
                        title="Edit / Undo"
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
                    <button onClick={() => markAttendance(a.id, 'present')} className="flex-1 py-2.5 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 hover:bg-green-500/20 text-[12px] font-bold flex items-center justify-center gap-2 transition-colors">
                      <Icon d={Icons.check} size={14} /> Mark Present
                    </button>
                    <button onClick={() => markAttendance(a.id, 'absent')} className="flex-1 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 text-[12px] font-bold flex items-center justify-center gap-2 transition-colors">
                      <Icon d={Icons.x} size={14} /> Mark Absent
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── ADD SUBJECT MODAL ─── */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add New Subject">
        <form onSubmit={handleAddSubject} className="flex flex-col gap-5">
          <div>
            <label className="block text-[11px] font-bold text-white/40 uppercase tracking-wider mb-1.5">Subject Name *</label>
            <input 
              type="text" placeholder="e.g., Data Structures"
              value={newSubject.subject} onChange={e => { setNewSubject({...newSubject, subject: e.target.value}); setErrors({...errors, subject: null}); }}
              className={`w-full bg-[#0d0d14] border rounded-xl px-4 py-3 text-slate-200 text-[13px] outline-none transition-colors ${errors.subject ? 'border-red-500/50 focus:border-red-500/50' : 'border-white/10 focus:border-indigo-500/50'}`}
            />
            {errors.subject && <span className="text-[11px] text-red-400 mt-1 block">{errors.subject}</span>}
          </div>

          {/* Timetable / Days Picker */}
          <div>
            <label className="block text-[11px] font-bold text-white/40 uppercase tracking-wider mb-2">Class Days (Optional)</label>
            <div className="flex gap-1.5 w-full">
              {WEEKDAYS.map(day => (
                <button
                  key={day} type="button" onClick={() => toggleDay(day, newSubject, setNewSubject)}
                  className={`flex-1 py-2 rounded-lg text-[11px] font-bold transition-all duration-200 ${
                    newSubject.days?.includes(day) 
                      ? 'bg-indigo-500/20 border border-indigo-500/50 text-indigo-300 shadow-md' 
                      : 'bg-[#0d0d14] border border-white/10 text-white/30 hover:bg-white/5 hover:text-white/60'
                  }`}
                >
                  {day.charAt(0)}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-white/40 uppercase tracking-wider mb-1.5">Classes Attended</label>
              <input type="number" min="0" placeholder="0" value={newSubject.present} onChange={e => setNewSubject({...newSubject, present: e.target.value})} className="w-full bg-[#0d0d14] border border-white/10 rounded-xl px-4 py-3 text-slate-200 text-[13px] outline-none focus:border-indigo-500/50" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-white/40 uppercase tracking-wider mb-1.5">Total Classes Held</label>
              <input type="number" min="0" placeholder="0" value={newSubject.total} onChange={e => setNewSubject({...newSubject, total: e.target.value})} className="w-full bg-[#0d0d14] border border-white/10 rounded-xl px-4 py-3 text-slate-200 text-[13px] outline-none focus:border-indigo-500/50" />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-white/40 uppercase tracking-wider mb-1.5">Target Percentage (%) *</label>
            <input type="number" min="1" max="100" placeholder="75" value={newSubject.required} onChange={e => { setNewSubject({...newSubject, required: e.target.value}); setErrors({...errors, required: null}); }} className={`w-full bg-[#0d0d14] border rounded-xl px-4 py-3 text-slate-200 text-[13px] outline-none transition-colors ${errors.required ? 'border-red-500/50 focus:border-red-500/50' : 'border-white/10 focus:border-indigo-500/50'}`} />
            {errors.required && <span className="text-[11px] text-red-400 mt-1 block">{errors.required}</span>}
          </div>

          <button type="submit" disabled={isSubmitting} className="w-full mt-2 bg-gradient-to-br from-indigo-500 to-purple-500 text-white font-bold text-[13px] py-3.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 shadow-lg shadow-indigo-500/20">
            {isSubmitting ? "Saving..." : "Add Subject"}
          </button>
        </form>
      </Modal>

      {/* ─── EDIT / UNDO SUBJECT MODAL ─── */}
      {editSubject && (
        <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Subject & Fix Mistakes">
          <form onSubmit={handleUpdateSubject} className="flex flex-col gap-5">
            <div>
              <label className="block text-[11px] font-bold text-white/40 uppercase tracking-wider mb-1.5">Subject Name</label>
              <input type="text" value={editSubject.subject} onChange={e => { setEditSubject({...editSubject, subject: e.target.value}); setErrors({...errors, subject: null}); }} className={`w-full bg-[#0d0d14] border rounded-xl px-4 py-3 text-slate-200 text-[13px] outline-none transition-colors ${errors.subject ? 'border-red-500/50 focus:border-red-500/50' : 'border-white/10 focus:border-amber-500/50'}`} />
              {errors.subject && <span className="text-[11px] text-red-400 mt-1 block">{errors.subject}</span>}
            </div>

            {/* Timetable / Days Picker for Edit Modal */}
            <div>
              <label className="block text-[11px] font-bold text-white/40 uppercase tracking-wider mb-2">Class Days</label>
              <div className="flex gap-1.5 w-full">
                {WEEKDAYS.map(day => (
                  <button
                    key={day} type="button" onClick={() => toggleDay(day, editSubject, setEditSubject)}
                    className={`flex-1 py-2 rounded-lg text-[11px] font-bold transition-all duration-200 ${
                      editSubject.days?.includes(day) 
                        ? 'bg-amber-500/20 border border-amber-500/50 text-amber-400 shadow-md' 
                        : 'bg-[#0d0d14] border border-white/10 text-white/30 hover:bg-white/5 hover:text-white/60'
                    }`}
                  >
                    {day.charAt(0)}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-[11px] font-bold text-white/40 uppercase tracking-wider mb-2">Classes Attended</label>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => setEditSubject({...editSubject, present: Math.max(0, editSubject.present - 1)})} className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 text-lg transition-colors">-</button>
                  <input type="number" min="0" value={editSubject.present} onChange={e => setEditSubject({...editSubject, present: e.target.value})} className="flex-1 bg-[#0d0d14] border border-white/10 rounded-xl px-3 py-3 text-center text-slate-200 text-[15px] font-bold outline-none focus:border-amber-500/50" />
                  <button type="button" onClick={() => setEditSubject({...editSubject, present: editSubject.present + 1})} className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 text-lg transition-colors">+</button>
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-white/40 uppercase tracking-wider mb-2">Total Classes</label>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => setEditSubject({...editSubject, total: Math.max(0, editSubject.total - 1)})} className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 text-lg transition-colors">-</button>
                  <input type="number" min="0" value={editSubject.total} onChange={e => setEditSubject({...editSubject, total: e.target.value})} className="flex-1 bg-[#0d0d14] border border-white/10 rounded-xl px-3 py-3 text-center text-slate-200 text-[15px] font-bold outline-none focus:border-amber-500/50" />
                  <button type="button" onClick={() => setEditSubject({...editSubject, total: editSubject.total + 1})} className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 text-lg transition-colors">+</button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-white/40 uppercase tracking-wider mb-1.5">Target Percentage (%)</label>
              <input type="number" min="1" max="100" value={editSubject.required} onChange={e => { setEditSubject({...editSubject, required: e.target.value}); setErrors({...errors, required: null}); }} className={`w-full bg-[#0d0d14] border rounded-xl px-4 py-3 text-slate-200 text-[13px] outline-none transition-colors ${errors.required ? 'border-red-500/50 focus:border-red-500/50' : 'border-white/10 focus:border-amber-500/50'}`} />
              {errors.required && <span className="text-[11px] text-red-400 mt-1 block">{errors.required}</span>}
            </div>

            <div className="flex gap-3 mt-4">
              <button type="button" onClick={() => handleDeleteSubject(editSubject.id)} className="px-5 py-3.5 rounded-xl bg-red-500/10 text-red-400 text-[13px] font-bold hover:bg-red-500/20 transition-colors">Delete</button>
              <button type="submit" disabled={isSubmitting} className="flex-1 bg-gradient-to-br from-amber-500 to-orange-500 text-white font-bold text-[13px] py-3.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 shadow-lg shadow-amber-500/20">{isSubmitting ? "Saving..." : "Save Changes"}</button>
            </div>
          </form>
        </Modal>
      )}

      {/* ─── TOAST NOTIFICATION ─── */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 px-5 py-3 rounded-xl shadow-2xl backdrop-blur-md flex items-center gap-3 animate-[fadeIn_0.3s_ease-out]">
          <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center">✓</div>
          <span className="text-[13px] font-medium">{toast}</span>
        </div>
      )}

    </div>
  );
}