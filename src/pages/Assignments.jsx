import React, { useState, useEffect } from "react";
import Badge from "../components/ui/Badge";
import ProgressBar from "../components/ui/ProgressBar";
import { Icon, Icons } from "../components/ui/Icon";
import Modal from "../components/ui/Modal";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

export default function Assignments() {
  const { user } = useAuth();
  const [view, setView] = useState("list"); // list, kanban, calendar
  const [filter, setFilter] = useState("all");
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // UI States
  const [toast, setToast] = useState(null);
  const [showSubjectDropdown, setShowSubjectDropdown] = useState(false);

  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [newTask, setNewTask] = useState({
    title: "",
    subject: "",
    date: "",
    time: "",
    priority: "medium",
    repeat: "none"
  });

  const priorityConfig = {
    low: { label: "Low", colorClass: "bg-emerald-500/20 border-emerald-500/50 text-emerald-400" },
    medium: { label: "Medium", colorClass: "bg-amber-500/20 border-amber-500/50 text-amber-400" },
    high: { label: "High", colorClass: "bg-red-500/20 border-red-500/50 text-red-400" }
  };

  const subjectOptions = ["Physics", "Mathematics", "Computer Science", "English", "Chemistry", "General"];

  // ─── FETCH TASKS ──────────────────────────────────────────────────────────
  useEffect(() => {
    fetchTasks();
  }, [user]);

  const fetchTasks = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
    if (!error) setAssignments(data || []);
    setLoading(false);
  };

  // ─── TOAST NOTIFICATION ───────────────────────────────────────────────────
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ─── ADD TASK LOGIC ───────────────────────────────────────────────────────
  const handleAddTask = async (e) => {
    e.preventDefault();
    
    // 1. Validate Form (Inline Errors)
    const newErrors = {};
    if (!newTask.title.trim()) newErrors.title = "Task title is required.";
    if (!newTask.subject.trim()) newErrors.subject = "Please select or type a subject.";
    if (!newTask.date) newErrors.date = "Due date is required.";
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    // Combine date and time (if time exists) into a single string for the DB
    const combinedDue = newTask.time ? `${newTask.date}T${newTask.time}` : newTask.date;

    const taskToInsert = {
      user_id: user.id,
      title: newTask.title,
      subject: newTask.subject,
      due: combinedDue,
      priority: newTask.priority,
      status: "pending",
      progress: 0
      // Note: If you want 'repeat' to save to the DB, you must add a 'repeat_type' column to Supabase!
    };

    const { data, error } = await supabase.from('tasks').insert([taskToInsert]).select();
    
    if (!error && data) {
      setAssignments(prev => [data[0], ...prev]);
      setIsModalOpen(false);
      setNewTask({ title: "", subject: "", date: "", time: "", priority: "medium", repeat: "none" });
      showToast("Task created successfully!");
    }
    setIsSubmitting(false);
  };

  // ─── STATUS CYCLING & DRAG-AND-DROP ───────────────────────────────────────
  const cycleStatus = async (task) => {
    const statusFlow = { "pending": "in-progress", "in-progress": "completed", "completed": "pending" };
    const progressMap = { "pending": 0, "in-progress": 50, "completed": 100 };
    
    const newStatus = statusFlow[task.status] || "pending";
    const newProgress = progressMap[newStatus];

    updateTaskStatusInDB(task.id, newStatus, newProgress);
  };

  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData("taskId", taskId);
  };

  const handleDrop = (e, newStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("taskId");
    const progressMap = { "pending": 0, "in-progress": 50, "completed": 100, "overdue": 0 };
    updateTaskStatusInDB(taskId, newStatus, progressMap[newStatus]);
  };

  const updateTaskStatusInDB = async (id, status, progress) => {
    // Optimistic UI Update
    setAssignments(prev => prev.map(a => a.id === id ? { ...a, status, progress } : a));
    await supabase.from('tasks').update({ status, progress }).eq('id', id);
    showToast(`Task moved to ${status.replace('-', ' ')}`);
  };

  // ─── HELPERS ──────────────────────────────────────────────────────────────
  const filtered = filter === "all" ? assignments : assignments.filter(a => a.status === filter);

  const formatDateTime = (dateString) => {
    if (!dateString) return "No due date";
    try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return dateString;
      const timeStr = dateString.includes('T') ? ` at ${d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}` : '';
      return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}${timeStr}`;
    } catch { return dateString; }
  };

  return (
    <div className="flex flex-col gap-5 relative">
      
      {/* HEADER & CONTROLS */}
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h2 className="text-slate-100 font-bold text-[22px] font-['Sora']">Assignments</h2>
          <p className="text-white/40 text-[13px] mt-0.5">Track all your academic work</p>
        </div>
        <div className="flex gap-2.5">
          <div className="flex bg-white/5 border border-white/10 rounded-lg p-1">
            {["list", "kanban", "calendar"].map(v => (
              <button 
                key={v} onClick={() => setView(v)} 
                className={`px-3 py-1.5 rounded-md text-xs capitalize transition-colors ${view === v ? 'bg-indigo-500/30 text-indigo-400 shadow-sm' : 'text-white/40 hover:text-white/70'}`}
              >
                {v}
              </button>
            ))}
          </div>
          <button 
            onClick={() => setIsModalOpen(true)} 
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 text-white text-xs font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-indigo-500/20"
          >
            <Icon d={Icons.plus} size={14} /> Add Task
          </button>
        </div>
      </div>

      {/* FILTER TABS (Only show on List View) */}
      {view === "list" && (
        <div className="flex gap-2">
          {["all", "pending", "in-progress", "completed", "overdue"].map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3.5 py-1.5 rounded-full border text-xs capitalize transition-colors ${filter === f ? 'bg-indigo-500/20 border-indigo-500/30 text-indigo-400' : 'bg-transparent border-white/10 text-white/40 hover:bg-white/5'}`}>
              {f}
            </button>
          ))}
        </div>
      )}

      {/* ─── 1. LIST VIEW ─── */}
      {loading ? (
        <div className="text-white/40 text-sm mt-4 flex gap-2 items-center"><div className="w-4 h-4 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" /> Loading tasks...</div>
      ) : filtered.length === 0 ? (
        <div className="text-white/40 text-sm mt-4 bg-white/5 border border-white/10 p-8 rounded-2xl text-center border-dashed">
          No tasks found. Click "Add Task" to create one!
        </div>
      ) : (
        view === "list" && (
          <div className="flex flex-col gap-3">
            {filtered.map(task => (
              <div key={task.id} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-4 transition-colors hover:border-white/20">
                <button onClick={() => cycleStatus(task)} className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${task.status === "completed" ? 'border-green-400 bg-green-400/20 text-green-400' : task.status === "in-progress" ? 'border-amber-400 bg-amber-400/20 text-amber-400' : 'border-white/20 hover:border-white/40 text-transparent'}`}>
                  {task.status === "completed" ? <Icon d={Icons.check} size={14} /> : task.status === "in-progress" ? <span className="text-[10px] font-bold">~</span> : null}
                </button>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-medium ${task.status === "completed" ? 'text-white/30 line-through' : 'text-slate-200'}`}>{task.title}</div>
                  <div className="flex gap-3 mt-1 items-center">
                    <span className="text-xs text-white/40">📘 {task.subject}</span>
                    <span className={`text-xs ${task.status === "overdue" ? 'text-red-400' : 'text-white/40'}`}>🗓 {formatDateTime(task.due)}</span>
                  </div>
                  <div className="mt-2 flex items-center gap-2.5">
                    <div className="flex-1"><ProgressBar value={task.progress} color={task.status === "completed" ? "#4ade80" : task.status === "in-progress" ? "#fbbf24" : "#818cf8"} height={4} /></div>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0 items-center">
                  <Badge color={task.priority}>{task.priority}</Badge>
                  {/* Clickable Status Badge */}
                  <button onClick={() => cycleStatus(task)} className="cursor-pointer hover:opacity-80 transition-opacity">
                    <Badge color={task.status}>{task.status.replace('-', ' ')}</Badge>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* ─── 2. KANBAN VIEW ─── */}
      {view === "kanban" && !loading && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 overflow-x-auto pb-4">
          {["pending", "in-progress", "completed", "overdue"].map(col => {
            const colColors = { "pending": "text-slate-300 border-slate-500/30 bg-slate-500/10", "in-progress": "text-amber-400 border-amber-500/30 bg-amber-500/10", "completed": "text-green-400 border-green-500/30 bg-green-500/10", "overdue": "text-red-400 border-red-500/30 bg-red-500/10" };
            const colTasks = assignments.filter(a => a.status === col);
            return (
              <div 
                key={col} 
                onDragOver={(e) => e.preventDefault()} 
                onDrop={(e) => handleDrop(e, col)}
                className={`bg-white/5 border border-white/10 rounded-2xl p-4 min-h-[400px] flex flex-col gap-3 transition-colors hover:bg-white/[0.07]`}
              >
                <div className={`flex justify-between items-center pb-3 border-b border-white/5`}>
                  <h3 className="capitalize text-[13px] font-bold text-slate-200">{col.replace('-', ' ')}</h3>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${colColors[col]}`}>{colTasks.length}</span>
                </div>
                {colTasks.map(task => (
                  <div 
                    key={task.id} 
                    draggable 
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    className="bg-[#0d0d14] border border-white/5 rounded-xl p-3 cursor-grab active:cursor-grabbing hover:border-white/20 transition-colors shadow-lg"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <Badge color={task.priority}>{task.priority}</Badge>
                    </div>
                    <div className="text-[13px] font-medium text-slate-200 leading-tight mb-2">{task.title}</div>
                    <div className="flex flex-col gap-1 mt-auto pt-2 border-t border-white/5">
                      <span className="text-[11px] text-white/40 truncate">📘 {task.subject}</span>
                      <span className="text-[11px] text-white/40">🗓 {formatDateTime(task.due)}</span>
                    </div>
                  </div>
                ))}
                {colTasks.length === 0 && <div className="text-[11px] text-white/20 text-center mt-4 border border-dashed border-white/10 rounded-lg py-4">Drop tasks here</div>}
              </div>
            );
          })}
        </div>
      )}

      {/* ─── 3. CALENDAR VIEW ─── */}
      {view === "calendar" && !loading && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="grid grid-cols-7 gap-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
              <div key={d} className="text-center text-[11px] font-bold text-white/40 pb-2">{d}</div>
            ))}
            {/* Generating a dummy 35-day grid for UI representation */}
            {Array.from({ length: 35 }).map((_, i) => {
              const day = i - 2; // Offset to start the month
              const isValidDay = day > 0 && day <= 30;
              // Check if any task falls roughly on this day (simplistic check for demo)
              const tasksOnDay = isValidDay ? assignments.filter(a => a.due && new Date(a.due).getDate() === day) : [];
              
              return (
                <div key={i} className={`aspect-square rounded-xl flex flex-col items-center justify-center relative border transition-colors ${isValidDay ? 'bg-[#0d0d14] border-white/5 hover:border-white/20' : 'bg-transparent border-transparent opacity-30'} ${day === new Date().getDate() ? 'border-indigo-500/50 bg-indigo-500/10' : ''}`}>
                  <span className={`text-[13px] font-medium ${day === new Date().getDate() ? 'text-indigo-400' : 'text-slate-300'}`}>{isValidDay ? day : ''}</span>
                  {tasksOnDay.length > 0 && (
                    <div className="flex gap-1 absolute bottom-2">
                      {tasksOnDay.slice(0, 3).map(t => (
                        <div key={t.id} className={`w-1.5 h-1.5 rounded-full ${t.priority === 'high' ? 'bg-red-400' : t.priority === 'medium' ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── NEW TASK MODAL ─── */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Assignment">
        <form onSubmit={handleAddTask} className="flex flex-col gap-5">
          
          {/* Title */}
          <div>
            <label className="block text-[11px] font-bold text-white/40 uppercase tracking-wider mb-1.5">Task Title *</label>
            <input 
              type="text" placeholder="e.g., Thermodynamics Essay"
              value={newTask.title} onChange={e => { setNewTask({...newTask, title: e.target.value}); setErrors({...errors, title: null}); }}
              className={`w-full bg-[#0d0d14] border rounded-xl px-4 py-3 text-slate-200 text-[13px] outline-none transition-colors ${errors.title ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-indigo-500/50'}`}
            />
            {errors.title && <span className="text-[11px] text-red-400 mt-1 block">{errors.title}</span>}
          </div>

          {/* Subject (Custom Dropdown) */}
          <div className="relative">
            <label className="block text-[11px] font-bold text-white/40 uppercase tracking-wider mb-1.5">Subject *</label>
            <input 
              type="text" placeholder="Select or type subject"
              value={newTask.subject} 
              onFocus={() => setShowSubjectDropdown(true)}
              onBlur={() => setTimeout(() => setShowSubjectDropdown(false), 200)}
              onChange={e => { setNewTask({...newTask, subject: e.target.value}); setErrors({...errors, subject: null}); }}
              className={`w-full bg-[#0d0d14] border rounded-xl px-4 py-3 text-slate-200 text-[13px] outline-none transition-colors ${errors.subject ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-indigo-500/50'}`}
            />
            {showSubjectDropdown && (
              <div className="absolute z-10 w-full mt-1 bg-[#1a1a24] border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-[fadeIn_0.1s_ease-out]">
                {subjectOptions.filter(s => s.toLowerCase().includes(newTask.subject.toLowerCase())).map(option => (
                  <div 
                    key={option} 
                    onClick={() => { setNewTask({...newTask, subject: option}); setShowSubjectDropdown(false); setErrors({...errors, subject: null}); }}
                    className="px-4 py-2.5 text-[13px] text-slate-200 hover:bg-indigo-500/20 hover:text-indigo-300 cursor-pointer transition-colors"
                  >
                    {option}
                  </div>
                ))}
              </div>
            )}
            {errors.subject && <span className="text-[11px] text-red-400 mt-1 block">{errors.subject}</span>}
          </div>

          {/* Date & Time Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-white/40 uppercase tracking-wider mb-1.5">Due Date *</label>
              <input 
                type="date" 
                value={newTask.date} onChange={e => { setNewTask({...newTask, date: e.target.value}); setErrors({...errors, date: null}); }}
                className={`w-full bg-[#0d0d14] border rounded-xl px-4 py-3 text-slate-200 text-[13px] outline-none transition-colors [color-scheme:dark] ${errors.date ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-indigo-500/50'}`}
              />
              {errors.date && <span className="text-[11px] text-red-400 mt-1 block">{errors.date}</span>}
            </div>
            <div>
              <label className="block text-[11px] font-bold text-white/40 uppercase tracking-wider mb-1.5">Time (Optional)</label>
              <input 
                type="time" 
                value={newTask.time} onChange={e => setNewTask({...newTask, time: e.target.value})}
                className="w-full bg-[#0d0d14] border border-white/10 rounded-xl px-4 py-3 text-slate-200 text-[13px] outline-none focus:border-indigo-500/50 transition-colors [color-scheme:dark]"
              />
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-[11px] font-bold text-white/40 uppercase tracking-wider mb-2">Priority Level</label>
            <div className="flex gap-2 p-1 bg-white/5 rounded-xl border border-white/5">
              {Object.entries(priorityConfig).map(([key, config]) => (
                <button 
                  key={key} type="button" onClick={() => setNewTask({...newTask, priority: key})}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold capitalize transition-all duration-200
                    ${newTask.priority === key ? config.colorClass + ' shadow-md' : 'text-white/40 hover:text-white/70'}`}
                >
                  {config.label}
                </button>
              ))}
            </div>
          </div>

          {/* Repeat Feature */}
          <div>
            <label className="block text-[11px] font-bold text-white/40 uppercase tracking-wider mb-2">Repeat Task</label>
            <div className="flex gap-2">
              {["none", "daily", "weekly", "monthly"].map(r => (
                <button 
                  key={r} type="button" onClick={() => setNewTask({...newTask, repeat: r})}
                  className={`flex-1 py-2 rounded-lg border text-[11px] font-medium capitalize transition-all duration-200
                    ${newTask.repeat === r ? 'bg-purple-500/20 border-purple-500/50 text-purple-400' : 'bg-transparent border-white/10 text-white/40 hover:bg-white/5'}`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <button 
            type="submit" disabled={isSubmitting}
            className="w-full mt-2 bg-gradient-to-br from-indigo-500 to-purple-500 text-white font-bold text-[13px] py-3.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 shadow-lg shadow-indigo-500/20"
          >
            {isSubmitting ? "Saving..." : "Create Task"}
          </button>
        </form>
      </Modal>

      {/* ─── TOAST POPUP ─── */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-green-500/10 border border-green-500/30 text-green-400 px-5 py-3 rounded-xl shadow-2xl backdrop-blur-md flex items-center gap-3 animate-[fadeIn_0.3s_ease-out]">
          <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">✓</div>
          <span className="text-[13px] font-medium">{toast.message}</span>
        </div>
      )}

    </div>
  );
}