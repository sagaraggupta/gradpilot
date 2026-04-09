import React, { useState, useEffect, useMemo } from "react";
import Badge from "../components/ui/Badge";
import ProgressBar from "../components/ui/ProgressBar";
import { Icon, Icons } from "../components/ui/Icon";
import Modal from "../components/ui/Modal";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { processActivityXP } from "../lib/streakEngine"; 
import TaskModal from "../components/assignments/TaskModal";
import FlashcardModal from "../components/assignments/FlashcardModal";

export default function Assignments() {
  const { user } = useAuth();
  const [view, setView] = useState("list"); 
  const [filter, setFilter] = useState("all");
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subjectOptions, setSubjectOptions] = useState(["General"]);
  const [toast, setToast] = useState(null);
  const [showSubjectDropdown, setShowSubjectDropdown] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState([]);

  // ─── TASK MODAL STATES ───
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null); 
  const [errors, setErrors] = useState({});
  const [newTask, setNewTask] = useState({ title: "", subject: "", date: "", time: "", priority: "medium" });

  // ─── AI STUDY ENGINE STATES ───
  const [isFlashcardModalOpen, setIsFlashcardModalOpen] = useState(false);
  const [activeStudyTask, setActiveStudyTask] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [studyMode, setStudyMode] = useState(null); // 'summary', 'flashcards', 'quiz'
  const [studyData, setStudyData] = useState(null); // Holds the dynamic AI response

  useEffect(() => {
      document.title = "Assignments | GradPilot";
    }, []);

  const priorityConfig = {
    low: { label: "Low", colorClass: "bg-emerald-500/20 border-emerald-500/50 text-emerald-400" },
    medium: { label: "Medium", colorClass: "bg-amber-500/20 border-amber-500/50 text-amber-400" },
    high: { label: "High", colorClass: "bg-red-500/20 border-red-500/50 text-red-400" }
  };

  const getSubjectStyle = (subject) => {
    const s = subject?.toLowerCase() || "";
    if (s.includes("phys")) return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    if (s.includes("math")) return "bg-red-500/10 text-red-400 border-red-500/20";
    if (s.includes("comp") || s.includes("code")) return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    if (s.includes("eng")) return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    if (s.includes("chem")) return "bg-purple-500/10 text-purple-400 border-purple-500/20";
    return "bg-slate-500/10 text-slate-400 border-slate-500/20"; 
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user?.id) return;
    
    // 🚀 STEP 1: INSTANT LOAD (The Offline Cache)
    // Check if we have their tasks saved in local memory from their last visit
    const cacheKey = `gradpilot_tasks_${user.id}`;
    const cachedTasks = localStorage.getItem(cacheKey);
    
    if (cachedTasks) {
      setAssignments(JSON.parse(cachedTasks));
      setLoading(false); // Instantly drop the loading screen!
    } else {
      setLoading(true); // Only show loading spinner on their very first login
    }

    // 📡 STEP 2: BACKGROUND SYNC (The Revalidation)
    try {
      const [ tasksRes, attRes ] = await Promise.all([
        supabase.from('tasks').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('attendance').select('subject').eq('user_id', user.id)
      ]);
      
      if (tasksRes.error) throw tasksRes.error;
      
      // Run our Auto-Overdue Logic on the fresh data
      if (tasksRes.data) {
        const now = new Date();
        const processedTasks = tasksRes.data.map(task => {
          if (task.status !== 'completed' && task.due && new Date(task.due) < now && task.status !== 'overdue') {
            supabase.from('tasks').update({ status: 'overdue' }).eq('id', task.id).then();
            return { ...task, status: 'overdue' };
          }
          return task;
        });
        
        // Update the UI with the fresh, accurate data
        setAssignments(processedTasks);
        
        // 💾 STEP 3: UPDATE THE CACHE
        // Save this fresh data back to local storage for their next visit
        localStorage.setItem(cacheKey, JSON.stringify(processedTasks));
      }
      
      if (attRes.data && !attRes.error) {
        const uniqueSubjects = [...new Set(attRes.data.map(a => a.subject))];
        if (!uniqueSubjects.includes("General")) uniqueSubjects.push("General");
        setSubjectOptions(uniqueSubjects);
      }
    } catch (error) {
      console.error("Database sync failed:", error);
      // If the database fails but they have cached data, they can still use the app!
      if (!cachedTasks) {
        showToast("Failed to load assignments. Please check your internet connection.", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const formatText = (text) => {
    if (!text) return "";
    return text.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "No due date";
    try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return dateString;
      const timeStr = dateString.includes('T') ? ` at ${d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}` : '';
      return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}${timeStr}`;
    } catch { return dateString; }
  };

  const handleOpenNewTask = () => {
    setEditingTaskId(null);
    setNewTask({ title: "", subject: "", date: "", time: "", priority: "medium" });
    setIsModalOpen(true);
  };

  const handleOpenEditTask = (task) => {
    setEditingTaskId(task.id);
    let d = "", t = "";
    if (task.due) {
      const parts = task.due.split('T');
      d = parts[0];
      t = parts[1] ? parts[1].substring(0, 5) : "";
    }
    setNewTask({ title: task.title, subject: task.subject, date: d, time: t, priority: task.priority });
    setIsModalOpen(true);
  };

  const handleDeleteTask = async (id) => {
    if (!window.confirm("Are you sure you want to delete this assignment?")) return;
    
    // 🐛 Bug 3 Fix: Store old state for rollback
    const previousAssignments = [...assignments];
    setAssignments(prev => prev.filter(a => a.id !== id));
    
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    
    if (error) {
      setAssignments(previousAssignments); // Rollback the UI!
      showToast("Failed to delete task. Try again.", "error");
    } else {
      showToast("Task deleted forever.", "success");
    }
  };

  const handleSaveTask = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!newTask.title.trim()) newErrors.title = "Task title is required.";
    if (!newTask.subject.trim()) newErrors.subject = "Please select or type a subject.";
    if (!newTask.date) newErrors.date = "Due date is required.";
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    setIsSubmitting(true);
    setErrors({});
    const combinedDue = newTask.time ? `${newTask.date}T${newTask.time}` : newTask.date;

    if (editingTaskId) {
      const { error } = await supabase.from('tasks').update({
        title: newTask.title, subject: newTask.subject, due: combinedDue, priority: newTask.priority
      }).eq('id', editingTaskId);

      if (!error) {
        setAssignments(prev => prev.map(a => a.id === editingTaskId ? { ...a, title: newTask.title, subject: newTask.subject, due: combinedDue, priority: newTask.priority } : a));
        showToast("Task updated successfully!");
        setIsModalOpen(false);
      }
    } else {
      const taskToInsert = {
        user_id: user.id, title: newTask.title, subject: newTask.subject, due: combinedDue, priority: newTask.priority, status: "pending", progress: 0
      };

      const { data, error } = await supabase.from('tasks').insert([taskToInsert]).select();
      if (!error && data) {
        setAssignments(prev => [data[0], ...prev]);
        setIsModalOpen(false);
        if (window.confirm("Task created! Would you like to sync this to your Google Calendar?")) { addToGoogleCalendar(data[0]); }
        showToast("Task created successfully!");
      }
    }
    setIsSubmitting(false);
  };

  const cycleStatus = async (task) => {
    const statusFlow = { "pending": "in-progress", "in-progress": "completed", "completed": "pending" };
    const progressMap = { "pending": 0, "in-progress": 50, "completed": 100 };
    const newStatus = statusFlow[task.status] || "pending";
    updateTaskStatusInDB(task, newStatus, progressMap[newStatus]);
  };

  const updateTaskStatusInDB = async (task, status, progress) => {
    const completedAt = status === "completed" ? new Date().toISOString() : null;
    const oldStatus = task.status;
    
    setAssignments(prev => prev.map(a => a.id === task.id ? { ...a, status, progress, completed_at: completedAt } : a));
    await supabase.from('tasks').update({ status, progress, completed_at: completedAt }).eq('id', task.id);

    if (status === "completed" && oldStatus !== "completed") {
      // 🪙 Dynamic Rewards based on Priority
      const rewardMap = { low: 15, medium: 30, high: 50 };
      const earnedCredits = rewardMap[task.priority] || 30;

      const res = await processActivityXP(user.id, earnedCredits, 0); 
      if (res?.streakExtendedToday) showToast(`Task completed! +${earnedCredits} 🪙 & Streak Extended! 🔥`);
      else showToast(`Task completed! +${earnedCredits} 🪙 🚀`);
    } else {
      showToast(`Task moved to ${formatText(status)}`);
    }
  };

  const handleDragStart = (e, taskId) => { e.dataTransfer.setData("taskId", taskId); };

  const handleDrop = (e, newStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("taskId");
    
    const task = assignments.find(a => String(a.id) === String(taskId));
    if (!task) return;
    
    const progressMap = { "pending": 0, "in-progress": 50, "completed": 100, "overdue": 0 };
    updateTaskStatusInDB(task, newStatus, progressMap[newStatus]);
  };

  const addToGoogleCalendar = (task) => {
    if (!task.due) return showToast("This task needs a due date first!", "error");
    const baseUrl = "https://calendar.google.com/calendar/render?action=TEMPLATE";
    const title = encodeURIComponent(`[GradPilot] ${task.subject}: ${task.title}`);
    const details = encodeURIComponent(`Priority: ${task.priority.toUpperCase()}\n\nManage this task in GradPilot!`);
    const dueDate = new Date(task.due);
    const isAllDay = !task.due.includes('T');
    
    let dates = "";
    if (isAllDay) {
      const end = new Date(dueDate);
      end.setDate(end.getDate() + 1);
      const startStr = dueDate.toISOString().split('T')[0].replace(/-/g, '');
      const endStr = end.toISOString().split('T')[0].replace(/-/g, '');
      dates = `${startStr}/${endStr}`;
    } else {
      // 📅 FIX: Force Strict UTC string format (YYYYMMDDTHHMMSSZ) so G-Cal locks the timezone correctly
      const startStr = dueDate.toISOString().replace(/-|:|\.\d{3}/g, "");
      const end = new Date(dueDate.getTime() + 60 * 60 * 1000);
      const endStr = end.toISOString().replace(/-|:|\.\d{3}/g, "");
      dates = `${startStr}/${endStr}`;
    }
    
    window.open(`${baseUrl}&text=${title}&details=${details}&dates=${dates}`, '_blank');
    showToast("Opening Google Calendar...");
  };

  // 🚀 THE ED-TECH UPGRADE: Multi-Modal AI Engine
  const handleOpenStudyModal = (task) => {
    setActiveStudyTask(task);
    setStudyMode(null);
    setStudyData(null);
    setIsFlashcardModalOpen(true);
  };

  const generateStudyMaterial = async (mode, cost) => {
    // 1. Fetch current profile to check bank balance!
    const { data: profile } = await supabase.from('profiles').select('credits_balance').eq('id', user.id).single();
    
    if (!profile || (profile.credits_balance || 0) < cost) {
      return showToast(`Not enough Credits! You need ${cost} 🪙 to unlock this AI feature.`, "error");
    }

    // 2. Optimistically deduct credits for snappy UI
    const newBalance = profile.credits_balance - cost;
    await supabase.from('profiles').update({ credits_balance: newBalance }).eq('id', user.id);

    setStudyMode(mode);
    setIsGenerating(true);
    setStudyData(null);

    try {
      let prompt = "";
      if (mode === 'summary') {
        prompt = `Act as an expert professor. Write a concise, high-yield study summary for the topic: "${activeStudyTask.title}" (${activeStudyTask.subject || 'General'}). Return ONLY a pure JSON object: {"summary": "your formatted markdown summary here"}`;
      } else if (mode === 'flashcards') {
        prompt = `Generate 5 unique flashcards for studying the topic: "${activeStudyTask.title}" (${activeStudyTask.subject || 'General'}). Return ONLY a pure JSON array: [{"front": "Question?", "back": "Answer"}]`;
      } else if (mode === 'quiz') {
        prompt = `Generate a 3-question multiple-choice quiz for the topic: "${activeStudyTask.title}" (${activeStudyTask.subject || 'General'}). Return ONLY a pure JSON array: [{"question": "...", "options": ["A", "B", "C", "D"], "correctAnswer": "Exact string of correct option", "explanation": "..."}]`;
      }

      const { data, error } = await supabase.functions.invoke('ai-chat', { body: { prompt } });
      if (error) throw error;
      
      // Bulletproof JSON parsing
      const jsonMatch = data.reply.match(/(\{|\[)[\s\S]*(\}|\])/);
      if (!jsonMatch) throw new Error("AI did not return valid JSON.");
      
      setStudyData(JSON.parse(jsonMatch[0]));

    } catch (err) {
      console.error("AI Generation Failed:", err);
      // 3. Refund the credits if the AI crashes!
      await supabase.from('profiles').update({ credits_balance: profile.credits_balance }).eq('id', user.id);
      showToast("AI core failed. Your credits have been refunded.", "error");
      setStudyMode(null);
    } finally {
      setIsGenerating(false);
    }
  };
  
  const completeStudySession = async () => {
    setIsFlashcardModalOpen(false);
    const res = await processActivityXP(user.id, 40, 0); 
    showToast(`Study Session Complete! +40 🪙 ${res?.streakExtendedToday ? "🔥 Streak Extended!" : "🚀"}`);
  };

  // ─── BULK ACTION LOGIC ───
  const toggleTaskSelection = (id) => {
    setSelectedTasks(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedTasks.length === filtered.length) {
      setSelectedTasks([]); // Deselect all
    } else {
      setSelectedTasks(filtered.map(t => t.id)); // Select all currently filtered tasks
    }
  };

  const handleBulkComplete = async () => {
    if (!window.confirm(`Mark ${selectedTasks.length} tasks as completed?`)) return;
    
    const prevAssignments = [...assignments];
    const now = new Date().toISOString();
    
    // 1. Optimistic UI update
    setAssignments(prev => prev.map(a => 
      selectedTasks.includes(a.id) ? { ...a, status: 'completed', progress: 100, completed_at: now } : a
    ));
    setSelectedTasks([]); // Clear selection
    
    // 2. Database update
    const { error } = await supabase.from('tasks').update({ status: 'completed', progress: 100, completed_at: now }).in('id', selectedTasks);
    
    if (error) {
      setAssignments(prevAssignments);
      showToast("Bulk complete failed. Try again.", "error");
    } else {
      // 🪙 Calculate dynamic bulk reward
      const rewardMap = { low: 15, medium: 30, high: 50 };
      let creditsGained = 0;
      selectedTasks.forEach(id => {
        const task = prevAssignments.find(t => t.id === id);
        creditsGained += rewardMap[task?.priority] || 30;
      });

      await processActivityXP(user.id, creditsGained, 0);
      showToast(`${selectedTasks.length} tasks completed! +${creditsGained} 🪙 🔥`, "success");
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Are you sure you want to permanently delete ${selectedTasks.length} tasks?`)) return;
    
    const prevAssignments = [...assignments];
    
    // 1. Optimistic UI update
    setAssignments(prev => prev.filter(a => !selectedTasks.includes(a.id)));
    setSelectedTasks([]);
    
    // 2. Database update
    const { error } = await supabase.from('tasks').delete().in('id', selectedTasks);
    
    if (error) {
      setAssignments(prevAssignments);
      showToast("Bulk delete failed. Try again.", "error");
    } else {
      showToast(`${selectedTasks.length} tasks deleted forever.`, "success");
    }
  };

  const filtered = useMemo(() => {
    let result = filter === "all" ? assignments : assignments.filter(a => a.status === filter);
    const priorityWeight = { high: 3, medium: 2, low: 1 };

    return [...result].sort((a, b) => {
      if (a.status === 'overdue' && b.status !== 'overdue') return -1;
      if (b.status === 'overdue' && a.status !== 'overdue') return 1;

      const pA = priorityWeight[a.priority] || 0;
      const pB = priorityWeight[b.priority] || 0;
      if (pA !== pB) return pB - pA;

      if (a.due && b.due) return new Date(a.due) - new Date(b.due);
      if (a.due) return -1; 
      if (b.due) return 1;

      return 0;
    });
  }, [assignments, filter]); 

  if (loading) return <div className="flex h-[80vh] items-center justify-center text-white/40"><div className="w-6 h-6 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin mr-3" /> Fetching Assignments...</div>;
  return (
    <div className="flex flex-col gap-5 relative">
      
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h2 className="text-slate-100 font-bold text-[22px] font-['Plus_Jakarta_Sans']">Assignments</h2>
          <p className="text-white/40 text-[13px] mt-0.5">Track all your academic work</p>
        </div>
        <div className="flex gap-2.5">
          <div className="flex bg-white/5 border border-white/10 rounded-lg p-1">
            {["list", "kanban"].map(v => (
              <button key={v} onClick={() => setView(v)} className={`px-4 py-1.5 rounded-md text-xs capitalize transition-colors font-bold ${view === v ? 'bg-indigo-500/30 text-indigo-400 shadow-sm' : 'text-white/40 hover:text-white/70'}`}>
                {v}
              </button>
            ))}
          </div>
          <button onClick={handleOpenNewTask} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 text-white text-xs font-bold hover:opacity-90 shadow-lg shadow-indigo-500/20">
            <Icon d={Icons.plus} size={14} /> Add Task
          </button>
        </div>
      </div>

      {view === "list" && (
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {["all", "pending", "in-progress", "completed", "overdue"].map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-4 py-1.5 rounded-full border text-xs font-bold whitespace-nowrap transition-colors ${filter === f ? 'bg-indigo-500/20 border-indigo-500/30 text-indigo-400' : 'bg-transparent border-white/10 text-white/40 hover:bg-white/5'}`}>
              {formatText(f)}
            </button>
          ))}
          <button onClick={toggleSelectAll} className="ml-auto px-3 py-1.5 rounded-lg border border-white/10 text-[11px] font-bold text-white/40 hover:text-white hover:bg-white/5 transition-colors whitespace-nowrap">
            {selectedTasks.length === filtered.length && filtered.length > 0 ? "Deselect All" : "Select All"}
          </button>
        </div>
      )}

      {/* ─── 1. LIST VIEW ─── */}
      {loading ? (
        <div className="text-white/40 text-sm mt-4 flex gap-2 items-center"><div className="w-4 h-4 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" /> Loading tasks...</div>
      ) : filtered.length === 0 ? (
        <div className="text-white/40 text-sm mt-4 bg-white/5 border border-white/10 p-8 rounded-2xl text-center border-dashed">No tasks found. Click "Add Task" to create one!</div>
      ) : (
        view === "list" && (
          <div className="flex flex-col gap-3">
            {filtered.map(task => (
              <div key={task.id} className="bg-[#0d0d14] border border-white/5 rounded-2xl p-5 transition-colors hover:border-white/20 group">
                
                <div className="flex items-start md:items-center gap-4 flex-col md:flex-row w-full">
                  {/* 🚀 NEW: BULK SELECT CHECKBOX */}
                  <div className="flex items-center gap-3 shrink-0">
                    <input 
                      type="checkbox" 
                      checked={selectedTasks.includes(task.id)}
                      onChange={() => toggleTaskSelection(task.id)}
                      className="w-4 h-4 rounded border-white/20 bg-white/5 text-indigo-500 focus:ring-indigo-500/50 focus:ring-offset-[#0d0d14] cursor-pointer transition-all"
                    />
                    
                    <button onClick={() => cycleStatus(task)} className={`w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${task.status === "completed" ? 'border-green-400 bg-green-400/20 text-green-400 scale-110' : task.status === "in-progress" ? 'border-amber-400 bg-amber-400/20 text-amber-400' : 'border-white/20 hover:border-indigo-400 hover:bg-indigo-400/10 text-transparent'}`}>
                      {task.status === "completed" ? <Icon d={Icons.check} size={14} /> : task.status === "in-progress" ? <span className="text-[10px] font-bold">~</span> : <Icon d={Icons.check} size={14} className="opacity-0 group-hover:opacity-100 text-indigo-400" />}
                    </button>
                  </div>
                  
                  <div className="flex-1 min-w-0 w-full">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className={`text-[15px] font-bold ${task.status === "completed" ? 'text-white/30 line-through' : 'text-slate-200'}`}>{task.title}</div>
                      <Badge color={task.priority}><span className="capitalize">{formatText(task.priority)}</span></Badge>
                      <button onClick={() => cycleStatus(task)} className="cursor-pointer hover:opacity-80 transition-opacity">
                        <Badge color={task.status}>{formatText(task.status)}</Badge>
                      </button>
                    </div>
                    
                    <div className="flex gap-4 items-center flex-wrap mb-3">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wider ${getSubjectStyle(task.subject)}`}>{task.subject}</span>
                      <span className={`text-[12px] font-medium ${task.status === "overdue" ? 'text-red-400' : 'text-white/40'}`}>🗓 {formatDateTime(task.due)}</span>
                      {task.status !== "completed" && <span className="text-[11px] font-bold text-white/30 ml-auto md:ml-0">{task.progress}% Complete</span>}
                    </div>

                    {/* FIX 2: Progress Bar Restored to its original beautiful state in the List View! */}
                    {task.status !== "completed" && (
                      <div className="w-full mt-1">
                        <ProgressBar value={task.progress} color={task.status === "in-progress" ? "#fbbf24" : "#818cf8"} height={5} />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 shrink-0 w-full md:w-auto justify-end mt-3 md:mt-0 pt-3 md:pt-0 border-t border-white/5 md:border-0">
                    <button onClick={() => handleOpenEditTask(task)} className="w-8 h-8 rounded-lg bg-white/5 text-white/40 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors" title="Edit Task">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    </button>
                    <button onClick={() => handleDeleteTask(task.id)} className="w-8 h-8 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 flex items-center justify-center transition-colors mr-2" title="Delete Task">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                    
                    {task.status !== "completed" && task.due && (
                      <button onClick={() => addToGoogleCalendar(task)} className="text-[11px] font-bold text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-lg hover:bg-indigo-500/20 transition-colors flex items-center gap-1.5">📅 GCal</button>
                    )}
                    {task.status !== "completed" && (
                      <button onClick={() => handleOpenStudyModal(task)} className="text-[11px] font-bold text-fuchsia-300 bg-fuchsia-500/10 border border-fuchsia-500/20 px-3 py-1.5 rounded-lg hover:bg-fuchsia-500/20 transition-colors flex items-center gap-1.5 shadow-[0_0_10px_rgba(217,70,239,0.1)]">
                        🪄 Study
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* ─── 2. KANBAN VIEW ─── */}
      {view === "kanban" && !loading && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 overflow-x-auto pb-4 items-start">
          {["pending", "in-progress", "completed", "overdue"].map(col => {
            const colColors = { "pending": "text-slate-300 border-slate-500/30 bg-slate-500/10", "in-progress": "text-amber-400 border-amber-500/30 bg-amber-500/10", "completed": "text-green-400 border-green-500/30 bg-green-500/10", "overdue": "text-red-400 border-red-500/30 bg-red-500/10" };
            const colTasks = assignments.filter(a => a.status === col);
            return (
              <div key={col} onDragOver={(e) => e.preventDefault()} onDrop={(e) => handleDrop(e, col)} className={`bg-white/5 border border-white/10 rounded-2xl p-4 min-h-[400px] flex flex-col gap-3 transition-colors hover:bg-white/[0.07]`}>
                <div className={`flex justify-between items-center pb-3 border-b border-white/5`}>
                  <h3 className="text-[13px] font-bold text-slate-200">{formatText(col)}</h3>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${colColors[col]}`}>{colTasks.length}</span>
                </div>
                {colTasks.map(task => (
                  <div key={task.id} draggable onDragStart={(e) => handleDragStart(e, task.id)} className="bg-[#0d0d14] border border-white/5 rounded-xl p-4 cursor-grab active:cursor-grabbing hover:border-white/20 transition-colors shadow-lg relative group">
                    
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-[#0d0d14] p-1 rounded-lg border border-white/10 z-10">
                      <button onClick={() => handleOpenEditTask(task)} className="w-6 h-6 rounded flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 text-[10px]" title="Edit">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                      </button>
                      <button onClick={() => handleDeleteTask(task.id)} className="w-6 h-6 rounded flex items-center justify-center text-red-400 hover:bg-red-500/20 text-[10px]" title="Delete">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                      </button>
                    </div>

                    <div className="flex justify-between items-start mb-2 pr-12">
                      <Badge color={task.priority}><span className="capitalize">{formatText(task.priority)}</span></Badge>
                    </div>
                    
                    <div className={`text-[13px] font-bold leading-tight mb-3 ${task.status === 'completed' ? 'text-white/30 line-through' : 'text-slate-200'}`}>{task.title}</div>
                    
                    {task.status !== "completed" && (
                      <div className="mb-3"><ProgressBar value={task.progress} color={task.status === "in-progress" ? "#fbbf24" : "#818cf8"} height={4} /></div>
                    )}

                    <div className="flex flex-col gap-2 mt-auto pt-3 border-t border-white/5">
                      <div className="flex justify-between items-center">
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold border uppercase tracking-wider ${getSubjectStyle(task.subject)}`}>{task.subject}</span>
                        <span className="text-[10px] font-medium text-white/40">🗓 {new Date(task.due).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                      </div>
                      
                      <div className="flex gap-1.5 mt-1">
                        {task.status !== "completed" && task.due && (
                          <button onClick={() => addToGoogleCalendar(task)} className="flex-1 text-[10px] font-bold text-indigo-300 bg-indigo-500/10 py-1.5 rounded-lg hover:bg-indigo-500/20 transition-colors text-center">📅 GCal</button>
                        )}
                        {task.status !== "completed" && (
                          <button onClick={() => handleOpenStudyModal(task)} className="flex-1 text-[10px] font-bold text-fuchsia-300 bg-fuchsia-500/10 py-1.5 rounded-lg hover:bg-fuchsia-500/20 transition-colors text-center shadow-[0_0_10px_rgba(217,70,239,0.1)]">🪄 Study</button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {colTasks.length === 0 && <div className="text-[11px] font-bold text-white/20 text-center mt-4 border border-dashed border-white/10 rounded-xl py-6 bg-white/[0.02]">Drop tasks here</div>}
              </div>
            );
          })}
        </div>
      )}

      {/* ─── MODULARIZED TASK MODAL ─── */}
      <TaskModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingTaskId={editingTaskId}
        handleSaveTask={handleSaveTask}
        isSubmitting={isSubmitting}
        newTask={newTask}
        setNewTask={setNewTask}
        errors={errors}
        setErrors={setErrors}
        showSubjectDropdown={showSubjectDropdown}
        setShowSubjectDropdown={setShowSubjectDropdown}
        subjectOptions={subjectOptions}
        priorityConfig={priorityConfig}
      />

      {/* ─── MODULARIZED AI STUDY MODAL ─── */}
      <FlashcardModal 
        isOpen={isFlashcardModalOpen}
        onClose={() => setIsFlashcardModalOpen(false)}
        isGenerating={isGenerating}
        activeStudyTask={activeStudyTask}
        studyMode={studyMode}
        studyData={studyData}
        generateStudyMaterial={generateStudyMaterial}
        completeStudySession={completeStudySession}
      />

      {/* ─── 🚀 BULK ACTION FLOATING BAR ─── */}
      {selectedTasks.length > 0 && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[90] bg-[#1a1a24] border border-indigo-500/30 p-3 rounded-2xl shadow-[0_20px_50px_rgba(99,102,241,0.3)] flex items-center gap-4 animate-[slideUp_0.3s_ease-out] backdrop-blur-xl">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-500 text-white text-[11px] font-bold shadow-lg">
              {selectedTasks.length}
            </span>
            <span className="text-[12px] font-bold text-slate-200 hidden sm:block">Tasks Selected</span>
          </div>
          
          <div className="flex items-center gap-2 pl-2 border-l border-white/10">
            <button onClick={handleBulkComplete} className="px-4 py-2 bg-gradient-to-r from-green-400 to-emerald-500 text-[#0d0d14] text-[12px] font-bold rounded-xl hover:scale-105 shadow-lg shadow-green-500/20 transition-all flex items-center gap-1.5">
              ✓ Complete
            </button>
            <button onClick={handleBulkDelete} className="px-4 py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 text-[12px] font-bold rounded-xl transition-colors flex items-center gap-1.5">
              <Icon d={Icons.delete} size={14} /> Delete
            </button>
          </div>
          
          <button onClick={() => setSelectedTasks([])} className="w-8 h-8 flex items-center justify-center rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-colors ml-1" title="Cancel">
            ✕
          </button>
        </div>
      )}

      {/* ─── TOAST NOTIFICATIONS ─── */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-[100] px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-[fadeIn_0.3s_ease-out] border backdrop-blur-md ${toast.type === "error" ? "bg-red-500/10 border-red-500/30 text-red-400" : "bg-green-500/10 border-green-500/30 text-green-400"}`}>
          <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold ${toast.type === "error" ? "bg-red-500/20" : "bg-green-500/20"}`}>
            {toast.type === "error" ? "✕" : "✓"}
          </div>
          <span className="text-[13px] font-medium">{toast.message}</span>
        </div>
      )}

    </div>
  );
}