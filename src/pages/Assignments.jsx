import React, { useState, useEffect } from "react";
import Badge from "../components/ui/Badge";
import ProgressBar from "../components/ui/ProgressBar";
import { Icon, Icons } from "../components/ui/Icon";
import Modal from "../components/ui/Modal";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { processActivityXP } from "../lib/streakEngine"; 

export default function Assignments() {
  const { user } = useAuth();
<<<<<<< HEAD
  const [view, setView] = useState("list"); 
=======
  const [view, setView] = useState("list"); // 'list' or 'kanban'
>>>>>>> d5c8fd0b23f1e1f126f3ab7cb66827dd5d3393e6
  const [filter, setFilter] = useState("all");
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subjectOptions, setSubjectOptions] = useState(["General"]);
  const [toast, setToast] = useState(null);
  const [showSubjectDropdown, setShowSubjectDropdown] = useState(false);

  // ─── TASK MODAL STATES ───
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null); 
  const [errors, setErrors] = useState({});
  const [newTask, setNewTask] = useState({ title: "", subject: "", date: "", time: "", priority: "medium" });

  // ─── AI FLASHCARD STATES ───
  const [isFlashcardModalOpen, setIsFlashcardModalOpen] = useState(false);
  const [activeStudyTask, setActiveStudyTask] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [flashcards, setFlashcards] = useState([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

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
    setLoading(true);
    const [ { data: tasksData }, { data: attData } ] = await Promise.all([
<<<<<<< HEAD
      // 🔒 FIX: Scoped query to stop homework data leaks
      supabase.from('tasks').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
=======
      supabase.from('tasks').select('*').order('created_at', { ascending: false }),
>>>>>>> d5c8fd0b23f1e1f126f3ab7cb66827dd5d3393e6
      supabase.from('attendance').select('subject').eq('user_id', user.id)
    ]);
    
    if (tasksData) setAssignments(tasksData);
    if (attData) {
      const uniqueSubjects = [...new Set(attData.map(a => a.subject))];
      if (!uniqueSubjects.includes("General")) uniqueSubjects.push("General");
      setSubjectOptions(uniqueSubjects);
    }
    setLoading(false);
  };

<<<<<<< HEAD
=======
  // FIX 1: Toast Bug - Uses standard 'message' variable
>>>>>>> d5c8fd0b23f1e1f126f3ab7cb66827dd5d3393e6
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
    setAssignments(prev => prev.filter(a => a.id !== id));
    await supabase.from('tasks').delete().eq('id', id);
    showToast("Task deleted forever.", "error");
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
    updateTaskStatusInDB(task.id, newStatus, progressMap[newStatus], task.status);
  };

  const updateTaskStatusInDB = async (id, status, progress, oldStatus) => {
    const completedAt = status === "completed" ? new Date().toISOString() : null;
    setAssignments(prev => prev.map(a => a.id === id ? { ...a, status, progress, completed_at: completedAt } : a));
    await supabase.from('tasks').update({ status, progress, completed_at: completedAt }).eq('id', id);

    if (status === "completed" && oldStatus !== "completed") {
      const res = await processActivityXP(user.id, 50, 0); 
      if (res?.streakExtendedToday) showToast(`Task completed! +50 XP & Streak Extended to ${res.newStreak} days! 🔥`);
      else showToast("Task completed! +50 XP 🚀");
    } else {
      showToast(`Task moved to ${formatText(status)}`);
    }
  };

  const handleDragStart = (e, taskId) => { e.dataTransfer.setData("taskId", taskId); };
  const handleDrop = (e, newStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("taskId");
    const task = assignments.find(a => a.id === taskId);
    if (!task) return;
    const progressMap = { "pending": 0, "in-progress": 50, "completed": 100, "overdue": 0 };
    updateTaskStatusInDB(taskId, newStatus, progressMap[newStatus], task.status);
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
<<<<<<< HEAD
      // 📅 FIX: Force Strict UTC string format (YYYYMMDDTHHMMSSZ) so G-Cal locks the timezone correctly
      const startStr = dueDate.toISOString().replace(/-|:|\.\d{3}/g, "");
      const end = new Date(dueDate.getTime() + 60 * 60 * 1000);
      const endStr = end.toISOString().replace(/-|:|\.\d{3}/g, "");
      dates = `${startStr}/${endStr}`;
    }
    
=======
      const startStr = dueDate.toISOString().replace(/-|:|\.\d\d\d/g, "");
      const end = new Date(dueDate.getTime() + 60 * 60 * 1000); 
      const endStr = end.toISOString().replace(/-|:|\.\d\d\d/g, "");
      dates = `${startStr}/${endStr}`;
    }
>>>>>>> d5c8fd0b23f1e1f126f3ab7cb66827dd5d3393e6
    window.open(`${baseUrl}&text=${title}&details=${details}&dates=${dates}`, '_blank');
    showToast("Opening Google Calendar...");
  };

<<<<<<< HEAD
  // 🤖 FIX: Actual dynamic AI Flashcards via Supabase Edge Function!
  const startStudySession = async (task) => {
=======
  // FIX 3: AI Flashcard Generator (Upgraded to use dynamic titles and more subjects)
  const startStudySession = (task) => {
>>>>>>> d5c8fd0b23f1e1f126f3ab7cb66827dd5d3393e6
    setActiveStudyTask(task);
    setIsFlashcardModalOpen(true);
    setIsGenerating(true);
    setFlashcards([]);
    setCurrentCardIndex(0);
    setIsFlipped(false);

<<<<<<< HEAD
    try {
      const prompt = `Generate 5 unique flashcards for studying the academic assignment: "${task.title}" for the subject "${task.subject || 'General'}". Return ONLY a pure JSON array of objects. Structure: [{"front": "Question?", "back": "Answer"}]`;
      
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: { prompt }
      });

      if (error) throw error;
      
      let aiResponse = data.reply;
      
      // NEW: Bulletproof Regex to find the JSON array even if the AI adds conversational text
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error("AI did not return a valid JSON array.");
      
      setFlashcards(JSON.parse(jsonMatch[0]));

    } catch (err) {
      console.error("AI Generation Failed:", err);
      showToast("AI core failed to generate flashcards. Please try again.", "error");
      setIsFlashcardModalOpen(false);
    } finally {
      setIsGenerating(false);
    }
  };

  const nextCard = () => { setIsFlipped(false); setTimeout(() => setCurrentCardIndex(p => p + 1), 150); };
  const prevCard = () => { setIsFlipped(false); setTimeout(() => setCurrentCardIndex(p => p - 1), 150); };
  
  const completeStudySession = async () => {
    setIsFlashcardModalOpen(false);
    const res = await processActivityXP(user.id, 30, 0); 
    showToast(`Study Session Complete! +30 XP ${res?.streakExtendedToday ? "🔥 Streak Extended!" : "🚀"}`);
  };

  if (loading) return <div className="flex h-[80vh] items-center justify-center text-white/40"><div className="w-6 h-6 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin mr-3" /> Fetching Assignments...</div>;

=======
    setTimeout(() => {
      const subject = (task.subject || "").toLowerCase();
      const title = task.title || "this topic";
      let generatedDeck = [];

      if (subject.includes('phys')) {
        generatedDeck = [
          { front: `What physical principles apply to "${title}"?`, back: "It generally involves the interaction of force, mass, and energy conservation." },
          { front: "What is Newton's Second Law?", back: "Force equals mass times acceleration (F = ma)." },
          { front: "Define Thermodynamics.", back: "The branch of physics that deals with heat and other forms of energy." }
        ];
      } else if (subject.includes('math') || subject.includes('calc')) {
        generatedDeck = [
          { front: `What mathematical formulas are required for "${title}"?`, back: "You will primarily need algebraic manipulation and calculus theorems." },
          { front: "What is the derivative of x²?", back: "2x" },
          { front: "State the Pythagorean Theorem.", back: "a² + b² = c²" }
        ];
      } else if (subject.includes('comp') || subject.includes('code')) {
        generatedDeck = [
          { front: `What is the optimal algorithm used in "${title}"?`, back: "Usually, a sorting or searching algorithm (like QuickSort or Binary Search) is optimal." },
          { front: "What is the time complexity of a standard loop?", back: "O(N) - Linear Time." },
          { front: "Define 'Recursion'.", back: "A function that calls itself until it reaches a base case." }
        ];
      } else if (subject.includes('bio')) {
         generatedDeck = [
          { front: `What biological systems are involved in "${title}"?`, back: "Cellular respiration, genetic mutation, and metabolic pathways." },
          { front: "What is the powerhouse of the cell?", back: "The Mitochondria." },
          { front: "Define 'Photosynthesis'.", back: "The process by which plants convert sunlight into chemical energy." }
        ];
      } else {
        // Dynamic fallback utilizing the user's specific Task Name and Subject
        generatedDeck = [
          { front: `Summarize the main objective of "${title}".`, back: `The primary goal is to deeply analyze the concepts of ${task.subject} and demonstrate mastery of the material.` },
          { front: `What are 3 key terms to remember for "${title}"?`, back: `1. Core Principle\n2. Primary Methodology\n3. ${task.subject} Theory` },
          { front: `What is the most common mistake students make on "${title}"?`, back: `Forgetting to cite sources properly and skipping the foundational review of ${task.subject} concepts.` },
          { front: `How does "${title}" apply to the real world?`, back: `It develops critical thinking and directly applies to professional problem-solving in the field of ${task.subject}.` }
        ];
      }
      
      setFlashcards(generatedDeck);
      setIsGenerating(false);
    }, 2500); 
  };

  const nextCard = () => { setIsFlipped(false); setTimeout(() => { if (currentCardIndex < flashcards.length - 1) setCurrentCardIndex(prev => prev + 1); }, 150); };
  const prevCard = () => { setIsFlipped(false); setTimeout(() => { if (currentCardIndex > 0) setCurrentCardIndex(prev => prev - 1); }, 150); };
  const completeStudySession = async () => {
    setIsFlashcardModalOpen(false);
    await processActivityXP(user.id, 30, 0); 
    showToast(`Study Session Complete! +30 XP Earned 🧠`);
  };

>>>>>>> d5c8fd0b23f1e1f126f3ab7cb66827dd5d3393e6
  const filtered = filter === "all" ? assignments : assignments.filter(a => a.status === filter);

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
                
                <div className="flex items-start md:items-center gap-4 flex-col md:flex-row">
                  <button onClick={() => cycleStatus(task)} className={`w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${task.status === "completed" ? 'border-green-400 bg-green-400/20 text-green-400 scale-110' : task.status === "in-progress" ? 'border-amber-400 bg-amber-400/20 text-amber-400' : 'border-white/20 hover:border-indigo-400 hover:bg-indigo-400/10 text-transparent'}`}>
                    {task.status === "completed" ? <Icon d={Icons.check} size={14} /> : task.status === "in-progress" ? <span className="text-[10px] font-bold">~</span> : <Icon d={Icons.check} size={14} className="opacity-0 group-hover:opacity-100 text-indigo-400" />}
                  </button>
                  
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
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLineJoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    </button>
                    <button onClick={() => handleDeleteTask(task.id)} className="w-8 h-8 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 flex items-center justify-center transition-colors mr-2" title="Delete Task">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLineJoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                    
                    {task.status !== "completed" && task.due && (
                      <button onClick={() => addToGoogleCalendar(task)} className="text-[11px] font-bold text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-lg hover:bg-indigo-500/20 transition-colors flex items-center gap-1.5">📅 GCal</button>
                    )}
                    {task.status !== "completed" && (
                      <button onClick={() => startStudySession(task)} className="text-[11px] font-bold text-fuchsia-300 bg-fuchsia-500/10 border border-fuchsia-500/20 px-3 py-1.5 rounded-lg hover:bg-fuchsia-500/20 transition-colors flex items-center gap-1.5 shadow-[0_0_10px_rgba(217,70,239,0.1)]">
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
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLineJoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                      </button>
                      <button onClick={() => handleDeleteTask(task.id)} className="w-6 h-6 rounded flex items-center justify-center text-red-400 hover:bg-red-500/20 text-[10px]" title="Delete">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLineJoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
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
                          <button onClick={() => startStudySession(task)} className="flex-1 text-[10px] font-bold text-fuchsia-300 bg-fuchsia-500/10 py-1.5 rounded-lg hover:bg-fuchsia-500/20 transition-colors text-center shadow-[0_0_10px_rgba(217,70,239,0.1)]">🪄 Study</button>
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

      {/* ─── DYNAMIC TASK MODAL (Create & Edit) ─── */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingTaskId ? "Edit Assignment" : "Create New Assignment"}>
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

      {/* ─── AI FLASHCARD MODAL ─── */}
      <Modal isOpen={isFlashcardModalOpen} onClose={() => setIsFlashcardModalOpen(false)} title="AI Study Session">
        {isGenerating ? (
          <div className="py-20 flex flex-col items-center justify-center text-center">
            <div className="relative w-20 h-20 mb-6">
              <div className="absolute inset-0 border-4 border-fuchsia-500/20 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-fuchsia-500 border-t-transparent rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center text-3xl animate-pulse">🤖</div>
            </div>
            <h3 className="text-lg font-bold text-slate-200 mb-2">Gemini is reading your syllabus...</h3>
            <p className="text-white/40 text-[13px] font-bold">Generating custom flashcards for "{activeStudyTask?.title}"</p>
          </div>
        ) : flashcards.length > 0 ? (
          <div className="flex flex-col items-center py-4">
            
            <div className="text-[12px] font-bold text-white/40 uppercase tracking-widest mb-6">
              Card {currentCardIndex + 1} of {flashcards.length}
            </div>

            <div className="relative w-full max-w-sm h-64 [perspective:1000px] mb-8">
              <div className={`w-full h-full transition-all duration-500 [transform-style:preserve-3d] cursor-pointer shadow-2xl rounded-2xl ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`} onClick={() => setIsFlipped(!isFlipped)}>
                <div className="absolute inset-0 [backface-visibility:hidden] bg-gradient-to-br from-[#1a1a24] to-[#0d0d14] border border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
                  <div className="text-3xl mb-4 opacity-50">🤔</div>
                  <h3 className="text-[16px] font-bold text-slate-200 leading-relaxed">{flashcards[currentCardIndex].front}</h3>
                  <div className="absolute bottom-4 text-[10px] text-white/30 uppercase font-bold tracking-widest">Tap to flip</div>
                </div>
                <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] bg-gradient-to-br from-fuchsia-500/20 to-indigo-500/10 border border-fuchsia-500/30 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
                  <div className="text-3xl mb-4 opacity-80">💡</div>
                  <h3 className="text-[15px] font-bold text-fuchsia-200 leading-relaxed">{flashcards[currentCardIndex].back}</h3>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 w-full max-w-sm">
              <button onClick={prevCard} disabled={currentCardIndex === 0} className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white font-bold text-[13px] rounded-xl disabled:opacity-30 transition-colors">← Previous</button>
              {currentCardIndex === flashcards.length - 1 ? (
                <button onClick={completeStudySession} className="flex-1 py-3 bg-gradient-to-r from-green-400 to-emerald-500 text-[#0d0d14] font-bold text-[13px] rounded-xl shadow-[0_0_15px_rgba(52,211,153,0.4)] hover:scale-105 transition-all">Finish (+30 XP)</button>
              ) : (
                <button onClick={nextCard} className="flex-1 py-3 bg-indigo-500 text-white font-bold text-[13px] rounded-xl hover:bg-indigo-400 transition-colors">Next →</button>
              )}
            </div>
          </div>
        ) : null}
      </Modal>

      {/* FIX 1: Toast Variable Bug fixed! */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-[100] px-5 py-3 rounded-xl shadow-2xl backdrop-blur-md flex items-center gap-3 animate-[fadeIn_0.3s_ease-out] border ${toast.type === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-green-500/10 border-green-500/30 text-green-400'}`}>
          {toast.type === 'success' && <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">✓</div>}
          <span className="text-[13px] font-bold">{toast.message}</span>
        </div>
      )}

    </div>
  );
}