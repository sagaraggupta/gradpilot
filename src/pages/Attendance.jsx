import React, { useState, useEffect } from "react";
import StatCard from "../components/ui/StatCard";
import ProgressBar from "../components/ui/ProgressBar";
import Modal from "../components/ui/Modal";
import { Icon, Icons } from "../components/ui/Icon";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import SubjectCard from "../components/attendance/SubjectCard";
import AIPredictorCard from "../components/attendance/AIPredictorCard";
import AttendanceStats from "../components/attendance/AttendanceStats";
import SmartAlerts from "../components/attendance/SmartAlerts";
import { AddSubjectModal, EditSubjectModal } from "../components/attendance/AttendanceModals";
import TodaySchedule from "../components/attendance/TodaySchedule";
import AttendanceTrends from "../components/attendance/AttendanceTrends";

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
  // ─── ANTI-SPAM STATE ───
  const [updatingIds, setUpdatingIds] = useState(new Set());
  
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
    if (!user?.id) return; // 🐛 Bug 1 Fix: CRITICAL Null guard
    
    setLoading(true);
    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    // 🐛 Bug 2 Fix: Handle errors instead of silently ignoring them
    if (error) {
      console.error("Fetch error:", error);
      showToast("Failed to load attendance.", "error");
    } else if (data) {
      setSubjects(data);
    }
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

  // ─── QUICK ACTIONS & UNDO ──────────────────────────────────────────────────
  const markAttendance = async (id, type) => {
    if (updatingIds.has(id)) return; 
    setUpdatingIds(prev => new Set(prev).add(id));

    const subject = subjects.find(s => s.id === id);
    const previousSubjects = [...subjects]; 

    // Smart logic: If 'undo', decrease total by 1. If present > 0, decrease present by 1.
    const newTotal = type === 'undo' ? Math.max(0, subject.total - 1) : subject.total + 1;
    let newPresent = subject.present;
    if (type === 'present') newPresent += 1;
    if (type === 'undo' && subject.present > 0) newPresent -= 1; 

    setSubjects(prev => prev.map(s => s.id === id ? { ...s, total: newTotal, present: newPresent } : s));
    
    const { error } = await supabase.from('attendance').update({ total: newTotal, present: newPresent }).eq('id', id).eq('user_id', user.id);
    
    if (error) {
      setSubjects(previousSubjects); 
      showToast("Failed to update. Try again.", "error");
    } else {
      showToast(type === 'undo' ? `Undid last action for ${subject.subject}` : `Marked ${type} for ${subject.subject}`);
    }

    setUpdatingIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  // 🚀 NEW: BULK MARK TODAY (Improvement #5)
  const handleBulkMarkToday = async () => {
    const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'short' });
    const todaySubjects = subjects.filter(s => s.days?.includes(todayStr));

    if (todaySubjects.length === 0) {
      return showToast(`No classes officially scheduled for today (${todayStr}).`, "error");
    }
    if (!window.confirm(`Mark you as "Present" for all ${todaySubjects.length} classes scheduled for today?`)) return;

    const previousSubjects = [...subjects];
    const subjectIds = todaySubjects.map(s => s.id);

    // Optimistic Update
    setSubjects(prev => prev.map(s => subjectIds.includes(s.id) ? { ...s, total: s.total + 1, present: s.present + 1 } : s));

    try {
      // Execute all updates in parallel
      await Promise.all(todaySubjects.map(s => 
        supabase.from('attendance').update({ total: s.total + 1, present: s.present + 1 }).eq('id', s.id).eq('user_id', user.id)
      ));
      showToast(`Bulk marked ${todaySubjects.length} subjects present! 🔥`);
    } catch (error) {
      setSubjects(previousSubjects);
      showToast("Bulk update failed.", "error");
    }
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

// ─── CALCULATIONS & MEMOIZATION ───────────────────────────────────────────
  // 🚀 Improvement 7 & Bug 5 Fix: useMemo and safe division
  const stats = React.useMemo(() => {
    const totalClasses = subjects.reduce((acc, curr) => acc + (Number(curr.total) || 0), 0);
    const totalPresent = subjects.reduce((acc, curr) => acc + (Number(curr.present) || 0), 0);
    
    // Safe division to prevent Infinity/NaN bugs
    const overallPct = totalClasses > 0 ? Math.round((totalPresent / totalClasses) * 100) : 0;
    
    const subjectsAtRisk = subjects.filter(s => {
      if (!s.total || s.total <= 0) return false;
      const pct = Math.round((s.present / s.total) * 100);
      return pct < s.required;
    }).length;

    const statusState = subjects.length === 0 ? "No Data" : (subjectsAtRisk > 0 ? "Warning" : "Safe");
    const statusSub = subjects.length === 0 ? "Add a subject" : (subjectsAtRisk > 0 ? "Need to attend more" : "All targets met!");
    const statusColor = subjects.length === 0 ? "#818cf8" : (subjectsAtRisk > 0 ? "#f87171" : "#4ade80");

    return { totalClasses, totalPresent, overallPct, subjectsAtRisk, statusState, statusSub, statusColor };
  }, [subjects]);

  return (
    <div className="flex flex-col gap-5 relative pb-10">
      
      {/* HEADER */}
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h2 className="text-slate-100 font-bold text-[22px] font-['Sora']">Attendance Tracker</h2>
          <p className="text-white/40 text-[13px] mt-0.5">Manage your class targets</p>
        </div>
        <div className="flex gap-2">
          {/* 🚀 NEW BULK BUTTON */}
          <button 
            onClick={handleBulkMarkToday}
            className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-lg bg-green-500/10 text-green-400 border border-green-500/20 text-xs font-semibold hover:bg-green-500/20 transition-all"
          >
            ✓ Mark Today's Classes
          </button>
          
          <button 
            onClick={() => { setErrors({}); setIsAddModalOpen(true); }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 text-white text-xs font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-indigo-500/20"
          >
            <Icon d={Icons.plus} size={14} /> Add Subject
          </button>
        </div>
      </div>

      {/* 🚀 THE NEW SMART ALERTS ENGINE */}
      {!loading && subjects.length > 0 && (
        <SmartAlerts subjects={subjects} />
      )}

      {/* 📊 MODULAR STAT CARDS */}
      <AttendanceStats stats={stats} />

      {/* 🚀 PREMIUM DASHBOARD WIDGETS (Planner & Trends) */}
      {!loading && subjects.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-2 mb-2">
          <div className="lg:col-span-1">
            <TodaySchedule subjects={subjects} />
          </div>
          <div className="lg:col-span-2">
            <AttendanceTrends subjects={subjects} />
          </div>
        </div>
      )}

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
            {subjects.map((a) => (
              <SubjectCard 
                key={a.id} subject={a} markAttendance={markAttendance} updatingIds={updatingIds} 
                onEdit={(subjectToEdit) => { setErrors({}); setEditSubject(subjectToEdit); setIsEditModalOpen(true); }} 
              />
            ))}
          </div>
        )}
      </div>

      {/* 🗔 MODULAR ADD & EDIT MODALS */}
      <AddSubjectModal 
        isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)}
        newSubject={newSubject} setNewSubject={setNewSubject}
        handleAddSubject={handleAddSubject} isSubmitting={isSubmitting}
        errors={errors} setErrors={setErrors} toggleDay={toggleDay}
      />

      <EditSubjectModal 
        isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)}
        editSubject={editSubject} setEditSubject={setEditSubject}
        handleUpdateSubject={handleUpdateSubject} handleDeleteSubject={handleDeleteSubject}
        isSubmitting={isSubmitting} errors={errors} setErrors={setErrors} toggleDay={toggleDay}
      />

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