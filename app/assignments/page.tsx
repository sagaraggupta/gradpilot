"use client";

import { useState, useEffect } from "react";
import { Plus, Clock, CheckCircle2, ArrowRight, Trash2, CalendarDays, AlertTriangle, Play, Square, CheckSquare, LayoutGrid, Calendar as CalendarIcon, X, Pause } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/components/ToastContext";

type Status = "todo" | "in-progress" | "done";
type Priority = "high" | "medium" | "low";
type Subtask = { id: number; text: string; done: boolean };

type Assignment = {
  id: number;
  title: string;
  course: string;
  dueDate: string;
  status: Status;
  priority: Priority;
  subtasks: Subtask[]; 
};

export default function AssignmentsManager() {
  const { addToast } = useToast();

  const [tasks, setTasks] = useState<Assignment[]>([
    { 
      id: 1, title: "Read Chapter 4", course: "Physics 101", 
      dueDate: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(), 
      status: "todo", priority: "high",
      subtasks: [{ id: 101, text: "Take notes on pages 40-45", done: false }]
    },
    { 
      id: 2, title: "Calculus Worksheet", course: "Advanced Math", 
      dueDate: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), 
      status: "in-progress", priority: "medium",
      subtasks: [{ id: 102, text: "Complete part A", done: true }, { id: 103, text: "Review part B", done: false }]
    },
  ]);

  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskCourse, setNewTaskCourse] = useState("");
  const [newTaskDate, setNewTaskDate] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<Priority>("medium");
  const [newSubtaskText, setNewSubtaskText] = useState<{ [key: number]: string }>({});
  
  const [viewMode, setViewMode] = useState<"kanban" | "calendar">("kanban");
  
  const [activeTimerTask, setActiveTimerTask] = useState<Assignment | null>(null);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  const enrolledCourses = ["Advanced Mathematics", "Physics 101", "Operating Systems", "Database Systems"];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    } else if (timeLeft === 0 && isTimerRunning) {
      setIsTimerRunning(false);
      addToast("Pomodoro session complete! Take a break.", "success");
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timeLeft, addToast]);

  const startPomodoro = (task: Assignment) => {
    setActiveTimerTask(task); setTimeLeft(25 * 60); setIsTimerRunning(true);
    addToast(`Focus mode started for: ${task.title}`, "info");
  };

  const closeTimer = () => { setIsTimerRunning(false); setActiveTimerTask(null); };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60); const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !newTaskCourse.trim() || !newTaskDate) {
      addToast("Please fill out all fields, including the deadline.", "error"); return;
    }
    const newTask: Assignment = {
      id: Date.now(), title: newTaskTitle, course: newTaskCourse, dueDate: newTaskDate,
      status: "todo", priority: newTaskPriority, subtasks: [],
    };
    setTasks([...tasks, newTask]);
    setNewTaskTitle(""); setNewTaskCourse(""); setNewTaskDate(""); setNewTaskPriority("medium");
    addToast("Assignment added successfully!", "success");
  };

  const moveTask = (id: number, newStatus: Status) => {
    setTasks(tasks.map(task => task.id === id ? { ...task, status: newStatus } : task));
    if (newStatus === "done") addToast("Assignment completed!", "success");
  };

  const deleteTask = (id: number) => { setTasks(tasks.filter(t => t.id !== id)); addToast("Assignment deleted.", "info"); };

  const toggleSubtask = (taskId: number, subtaskId: number) => {
    setTasks(tasks.map(t => t.id !== taskId ? t : { ...t, subtasks: t.subtasks.map(st => st.id === subtaskId ? { ...st, done: !st.done } : st) }));
  };

  const addSubtask = (taskId: number) => {
    const text = newSubtaskText[taskId];
    if (!text || !text.trim()) return;
    setTasks(tasks.map(t => t.id !== taskId ? t : { ...t, subtasks: [...t.subtasks, { id: Date.now(), text, done: false }] }));
    setNewSubtaskText({ ...newSubtaskText, [taskId]: "" }); 
  };

  const formatDeadline = (dateString: string) => {
    const dueDate = new Date(dateString); const now = new Date();
    const formattedTime = dueDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    const niceDisplay = `${dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${formattedTime}`;
    const isToday = dueDate.toDateString() === now.toDateString();
    const isTomorrow = dueDate.toDateString() === new Date(now.getTime() + 86400000).toDateString();
    const diffTime = dueDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffTime < 0) return { text: `Overdue (${formattedTime})`, color: "text-red-500", iconColor: "text-red-500/50" };
    if (isToday) return { text: `Due Today at ${formattedTime}`, color: "text-orange-400", iconColor: "text-orange-400/50" };
    if (isTomorrow) return { text: `Due Tomorrow at ${formattedTime}`, color: "text-yellow-400", iconColor: "text-yellow-400/50" };
    if (diffDays <= 3) return { text: `Due in ${diffDays} days`, color: "text-blue-400", iconColor: "text-blue-400/50" };
    return { text: niceDisplay, color: "text-zinc-400", iconColor: "text-zinc-500" };
  };

  const renderCalendar = () => {
    const today = new Date();
    const year = today.getFullYear(); const month = today.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();

    const days = [];
    for (let i = 0; i < firstDay; i++) { days.push(<div key={`blank-${i}`} className="p-2 border border-zinc-800/50 bg-zinc-950/30 opacity-50 min-h-[100px]"></div>); }
    for (let day = 1; day <= daysInMonth; day++) {
      const isToday = day === today.getDate();
      const daysTasks = tasks.filter(t => new Date(t.dueDate).getDate() === day && new Date(t.dueDate).getMonth() === month);

      days.push(
        <div key={day} className={`p-2 border border-zinc-800/50 min-h-[120px] bg-zinc-900/40 hover:bg-zinc-800/50 transition-colors ${isToday ? 'ring-1 ring-blue-500/50 bg-blue-500/5' : ''}`}>
          <div className={`text-sm font-medium mb-2 ${isToday ? 'text-blue-400 bg-blue-500/10 w-7 h-7 flex items-center justify-center rounded-full' : 'text-zinc-500'}`}>{day}</div>
          <div className="flex flex-col gap-1">
            {daysTasks.map(t => (
              <div key={t.id} className={`text-[10px] truncate px-1.5 py-1 rounded border-l-2 ${t.status === 'done' ? 'bg-zinc-800/50 text-zinc-500 border-zinc-600 line-through' : t.priority === 'high' ? 'bg-red-500/10 text-red-400 border-red-500' : 'bg-blue-500/10 text-blue-400 border-blue-500'}`} title={t.title}>
                {t.title}
              </div>
            ))}
          </div>
        </div>
      );
    }
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="grid grid-cols-7 bg-zinc-950 border-b border-zinc-800 text-center py-3">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => <div key={d} className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">{d}</div>)}
        </div>
        <div className="grid grid-cols-7">{days}</div>
      </div>
    );
  };

  // NEW: We define the columns as data, and map over them directly in the return block!
  const kanbanColumns = [
    { id: "todo", title: "To Do", icon: <div className="w-3 h-3 rounded-full bg-zinc-500" /> },
    { id: "in-progress", title: "In Progress", icon: <div className="w-3 h-3 rounded-full bg-blue-500" /> },
    { id: "done", title: "Done", icon: <div className="w-3 h-3 rounded-full bg-emerald-500" /> },
  ];

  return (
    <main className="max-w-6xl mx-auto pb-24 md:pb-8 relative">
      <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Assignments</h1>
          <p className="text-zinc-400">Track tasks, deadlines, and study time.</p>
        </div>
        <div className="bg-zinc-900 p-1 rounded-xl border border-zinc-800 flex inline-flex">
          <button onClick={() => setViewMode("kanban")} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${viewMode === "kanban" ? "bg-zinc-800 text-white shadow" : "text-zinc-400 hover:text-zinc-200"}`}><LayoutGrid size={16} /> Kanban</button>
          <button onClick={() => setViewMode("calendar")} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${viewMode === "calendar" ? "bg-zinc-800 text-white shadow" : "text-zinc-400 hover:text-zinc-200"}`}><CalendarIcon size={16} /> Calendar</button>
        </div>
      </header>

      <AnimatePresence>
        {activeTimerTask && (
          <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 z-50 bg-zinc-900 border border-zinc-700 shadow-2xl p-4 rounded-2xl flex items-center gap-6 min-w-[320px]"
          >
            <div className="flex-1">
              <p className="text-xs text-blue-400 font-medium mb-0.5 uppercase tracking-wider">Focus Mode</p>
              <p className="text-white font-semibold truncate max-w-[150px]">{activeTimerTask.title}</p>
            </div>
            <div className="text-3xl font-bold font-mono tracking-tighter text-emerald-400">{formatTime(timeLeft)}</div>
            <div className="flex items-center gap-2">
              <button onClick={() => setIsTimerRunning(!isTimerRunning)} className={`p-3 rounded-full ${isTimerRunning ? 'bg-zinc-800 text-yellow-500 hover:bg-zinc-700' : 'bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500/30'}`}>
                {isTimerRunning ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
              </button>
              <button onClick={closeTimer} className="p-3 bg-zinc-800 text-zinc-400 hover:text-red-400 hover:bg-zinc-700 rounded-full"><X size={18} /></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={addTask} className="mb-8 flex flex-col gap-3 bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
        <div className="flex flex-col md:flex-row gap-3">
          <input type="text" placeholder="Task Title (e.g. Write Essay)" value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} className="flex-[2] bg-zinc-950 border border-zinc-800 text-white p-3 rounded-lg focus:outline-none focus:border-blue-500" />
          <input list="course-suggestions" placeholder="Course Name" value={newTaskCourse} onChange={(e) => setNewTaskCourse(e.target.value)} className="flex-1 bg-zinc-950 border border-zinc-800 text-white p-3 rounded-lg focus:outline-none focus:border-blue-500" />
          <datalist id="course-suggestions">{enrolledCourses.map(c => <option key={c} value={c} />)}</datalist>
          <select value={newTaskPriority} onChange={(e) => setNewTaskPriority(e.target.value as Priority)} className="flex-1 bg-zinc-950 border border-zinc-800 text-white p-3 rounded-lg focus:outline-none focus:border-blue-500 appearance-none">
            <option value="high">High Priority</option><option value="medium">Medium Priority</option><option value="low">Low Priority</option>
          </select>
        </div>
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-[3]">
            <CalendarDays className="absolute left-3 top-3.5 text-zinc-500" size={18} />
            <input type="datetime-local" value={newTaskDate} onChange={(e) => setNewTaskDate(e.target.value)} style={{ colorScheme: "dark" }} className="w-full bg-zinc-950 border border-zinc-800 text-zinc-400 py-3 pl-10 pr-4 rounded-lg focus:outline-none focus:border-blue-500 focus:text-white transition-colors" />
          </div>
          <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"><Plus size={20} /> Add Assignment</button>
        </div>
      </form>

      {/* RENDER THE BOARD INLINE WITHOUT A NESTED COMPONENT */}
      {viewMode === "kanban" ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {kanbanColumns.map((col) => {
            const columnTasks = tasks.filter(task => task.status === col.id);
            return (
              <div key={col.id} className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 flex flex-col min-h-[500px]">
                <div className="flex items-center gap-2 mb-6 pb-4 border-b border-zinc-800">
                  <div className="text-zinc-400">{col.icon}</div><h2 className="font-semibold text-white">{col.title}</h2>
                  <span className="ml-auto bg-zinc-800 text-zinc-400 text-xs py-1 px-2 rounded-full">{columnTasks.length}</span>
                </div>
                
                <div className="flex flex-col gap-3 flex-1">
                  <AnimatePresence>
                    {columnTasks.map((task) => {
                      const deadlineInfo = formatDeadline(task.dueDate);
                      const priorityStyles = { high: "border-l-red-500", medium: "border-l-yellow-500", low: "border-l-blue-500" };
                      const hoursUntilDue = (new Date(task.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60);
                      const showWarning = col.id === "todo" && hoursUntilDue > 0 && hoursUntilDue <= 24;

                      return (
                        <motion.div layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} key={task.id}
                          className={`bg-zinc-900 border-y border-r border-l-4 border-y-zinc-700 border-r-zinc-700 p-4 rounded-xl shadow-lg group ${priorityStyles[task.priority]}`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-xs font-medium text-blue-400 bg-blue-500/10 px-2 py-1 rounded-md">{task.course}</span>
                            <button onClick={() => deleteTask(task.id)} className="text-zinc-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16} /></button>
                          </div>
                          <h3 className="text-white font-medium mb-3">{task.title}</h3>

                          {showWarning && (
                            <div className="mb-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-3 py-2 rounded-lg flex items-start gap-2">
                              <AlertTriangle size={14} className="mt-0.5 shrink-0" /><span><strong>Start this now.</strong> Deadline approaching.</span>
                            </div>
                          )}

                          {task.subtasks.length > 0 && (
                            <div className="flex flex-col gap-1.5 mb-3 bg-zinc-950/50 p-2 rounded-lg border border-zinc-800">
                              {task.subtasks.map(st => (
                                <div key={st.id} onClick={() => toggleSubtask(task.id, st.id)} className="flex items-start gap-2 text-sm cursor-pointer hover:text-white transition-colors">
                                  <button className={`mt-0.5 ${st.done ? 'text-emerald-500' : 'text-zinc-500'}`}>{st.done ? <CheckSquare size={14} /> : <Square size={14} />}</button>
                                  <span className={`${st.done ? 'text-zinc-500 line-through' : 'text-zinc-300'}`}>{st.text}</span>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 mb-3">
                            <input type="text" placeholder="Add subtask..." value={newSubtaskText[task.id] || ""} onChange={(e) => setNewSubtaskText({...newSubtaskText, [task.id]: e.target.value})} onKeyDown={(e) => e.key === 'Enter' && addSubtask(task.id)} className="flex-1 bg-zinc-950 border border-zinc-800 text-xs text-white px-2 py-1 rounded focus:outline-none focus:border-blue-500" />
                            <button onClick={() => addSubtask(task.id)} className="text-blue-500 hover:text-blue-400"><Plus size={14} /></button>
                          </div>
                          
                          <div className="flex flex-col gap-2 mt-auto">
                            <span className={`flex items-center gap-1.5 text-xs font-medium ${deadlineInfo.color}`}><Clock size={14} className={deadlineInfo.iconColor} /> {deadlineInfo.text}</span>
                            <div className="flex items-center justify-between border-t border-zinc-800 pt-3 mt-1">
                              {col.id !== "done" ? (
                                <button onClick={() => startPomodoro(task)} className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10 px-2 py-1 rounded transition-colors"><Play size={12} fill="currentColor" /> Focus</button>
                              ) : <span className="text-[10px] uppercase font-bold text-zinc-600">Finished</span>}
                              <div className="flex gap-1">
                                {col.id === "todo" && <button onClick={() => moveTask(task.id, "in-progress")} className="p-1.5 hover:bg-zinc-800 hover:text-white rounded-md transition-colors" title="Start"><ArrowRight size={16} /></button>}
                                {col.id === "in-progress" && <button onClick={() => moveTask(task.id, "done")} className="p-1.5 hover:bg-emerald-500/20 text-emerald-500 rounded-md transition-colors" title="Complete"><CheckCircle2 size={16} /></button>}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        renderCalendar()
      )}
    </main>
  );
}