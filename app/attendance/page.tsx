"use client";

import { useState } from "react";
import { Check, X, Plus, Trash2, RotateCcw, Target, Edit2, Save, CalendarDays, LayoutList, Calendar as CalendarIcon, Palette } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/components/ToastContext";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

// 1. ADDED COLOR TO SUBJECT TYPE
type Subject = {
  id: number;
  name: string;
  attended: number;
  total: number;
  target: number;
  days: number[];
  color: string; 
};

// We use a specific map so Tailwind knows exactly which classes to compile
const COLOR_OPTIONS = [
  { id: "blue", dot: "bg-blue-500", bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500" },
  { id: "purple", dot: "bg-purple-500", bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500" },
  { id: "rose", dot: "bg-rose-500", bg: "bg-rose-500/10", text: "text-rose-400", border: "border-rose-500" },
  { id: "amber", dot: "bg-amber-500", bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500" },
  { id: "emerald", dot: "bg-emerald-500", bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500" },
  { id: "cyan", dot: "bg-cyan-500", bg: "bg-cyan-500/10", text: "text-cyan-400", border: "border-cyan-500" },
];

export default function AttendanceTracker() {
  const { addToast } = useToast();

  const [subjects, setSubjects] = useState<Subject[]>([
    { id: 1, name: "Advanced Mathematics", attended: 12, total: 15, target: 75, days: [1, 3, 5], color: "blue" },
    { id: 2, name: "Physics 101", attended: 8, total: 10, target: 85, days: [2, 4], color: "purple" },
  ]);

  const [newSubjectName, setNewSubjectName] = useState("");
  const [newSubjectTarget, setNewSubjectTarget] = useState("");
  const [initialAttended, setInitialAttended] = useState("");
  const [initialTotal, setInitialTotal] = useState("");
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [newSubjectColor, setNewSubjectColor] = useState("blue"); // Default color
  
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editTarget, setEditTarget] = useState("");

  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");

  const weekDays = [
    { label: "M", value: 1 }, { label: "T", value: 2 }, { label: "W", value: 3 },
    { label: "Th", value: 4 }, { label: "F", value: 5 }, { label: "Sa", value: 6 },
  ];

  const chartData = [
    { name: "Week 1", attendance: 82 }, { name: "Week 2", attendance: 85 },
    { name: "Week 3", attendance: 78 }, { name: "Week 4", attendance: 88 },
  ];

  const toggleDay = (dayValue: number) => {
    if (selectedDays.includes(dayValue)) setSelectedDays(selectedDays.filter(d => d !== dayValue));
    else setSelectedDays([...selectedDays, dayValue]);
  };

  const totalAttendedAcrossAll = subjects.reduce((sum, subject) => sum + subject.attended, 0);
  const totalClassesAcrossAll = subjects.reduce((sum, subject) => sum + subject.total, 0);
  const overallPercentage = totalClassesAcrossAll === 0 ? 100 : Math.round((totalAttendedAcrossAll / totalClassesAcrossAll) * 100);

  const addSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectName.trim()) { addToast("Please enter a class name.", "error"); return; }
    const attendedVal = parseInt(initialAttended) || 0;
    const totalVal = parseInt(initialTotal) || 0;
    if (attendedVal > totalVal) { addToast("Attended classes cannot be greater than total classes!", "error"); return; }

    const newSubject: Subject = {
      id: Date.now(), name: newSubjectName, attended: attendedVal, total: totalVal,
      target: newSubjectTarget ? parseInt(newSubjectTarget) : 75, 
      days: selectedDays, 
      color: newSubjectColor, // Save the selected color
    };
    
    setSubjects([...subjects, newSubject]);
    setNewSubjectName(""); setNewSubjectTarget(""); setInitialAttended(""); setInitialTotal(""); setSelectedDays([]); setNewSubjectColor("blue");
    addToast(`${newSubjectName} added!`, "success");
  };

  const deleteSubject = (id: number, name: string) => { setSubjects(subjects.filter(s => s.id !== id)); addToast(`${name} removed.`, "info"); };
  const startEditing = (subject: Subject) => { setEditingId(subject.id); setEditName(subject.name); setEditTarget(subject.target.toString()); };
  const saveEdit = (id: number) => {
    if (!editName.trim()) return;
    setSubjects(subjects.map(sub => sub.id === id ? { ...sub, name: editName, target: parseInt(editTarget) || 75 } : sub));
    setEditingId(null); addToast("Class updated!", "success");
  };

  const markPresent = (id: number) => setSubjects(subjects.map(s => s.id === id ? { ...s, attended: s.attended + 1, total: s.total + 1 } : s));
  const markAbsent = (id: number) => setSubjects(subjects.map(s => s.id === id ? { ...s, total: s.total + 1 } : s));
  const undoAction = (id: number) => setSubjects(subjects.map(s => (s.id === id && s.total > 0) ? { ...s, attended: s.attended > 0 ? s.attended - 1 : 0, total: s.total - 1 } : s));

  const calculatePrediction = (attended: number, total: number, target: number) => {
    if (total === 0) return { text: "No classes logged yet.", color: "text-zinc-400" };
    const currentPercent = (attended / total) * 100;
    if (currentPercent >= target) {
      const skipsAllowed = Math.floor((attended * 100 / target) - total);
      return skipsAllowed > 0 ? { text: `You can skip the next ${skipsAllowed} class${skipsAllowed > 1 ? 'es' : ''}.`, color: "text-yellow-500" } : { text: "You are exactly on target. Don't skip!", color: "text-zinc-400" };
    } else {
      const required = Math.ceil(((total * target) - (attended * 100)) / (100 - target));
      return { text: `Attend the next ${required} class${required > 1 ? 'es' : ''} to reach ${target}%.`, color: "text-red-400" };
    }
  };

  const renderCalendar = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay(); 

    const days = [];
    for (let i = 0; i < firstDay; i++) { 
      days.push(<div key={`blank-${i}`} className="p-2 border border-zinc-800/50 bg-zinc-950/30 opacity-50 min-h-[120px]"></div>); 
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dateString = new Date(year, month, day);
      const dayOfWeek = dateString.getDay(); 
      const isToday = day === today.getDate();
      
      const todaysClasses = subjects.filter(sub => sub.days.includes(dayOfWeek));

      days.push(
        <div key={day} className={`p-2 border border-zinc-800/50 min-h-[120px] bg-zinc-900/40 hover:bg-zinc-800/50 transition-colors ${isToday ? 'ring-1 ring-blue-500/50 bg-blue-500/5' : ''}`}>
          <div className={`text-sm font-medium mb-2 ${isToday ? 'text-blue-400 bg-blue-500/10 w-7 h-7 flex items-center justify-center rounded-full' : 'text-zinc-500'}`}>
            {day}
          </div>
          <div className="flex flex-col gap-1.5">
            {todaysClasses.map(sub => {
              // Get the specific color map for this subject
              const style = COLOR_OPTIONS.find(c => c.id === sub.color) || COLOR_OPTIONS[0];
              
              return (
                // DYNAMIC CALENDAR COLORS!
                <div key={sub.id} className={`text-[10px] font-medium truncate px-1.5 py-1 rounded border-l-2 ${style.bg} ${style.text} ${style.border}`} title={sub.name}>
                  {sub.name}
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden mt-8">
        <div className="grid grid-cols-7 bg-zinc-950 border-b border-zinc-800 text-center py-3">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
            <div key={d} className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">{days}</div>
      </div>
    );
  };

  return (
    <main className="max-w-4xl mx-auto pb-24 md:pb-12">
      <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Attendance</h1>
          <p className="text-zinc-400">Track your classes and predict your skips.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-end gap-4">
          <div className="bg-blue-500/10 border border-blue-500/20 px-6 py-4 rounded-xl flex items-center gap-4 h-full">
            <div>
              <p className="text-blue-400 text-sm font-medium mb-1">Overall Attendance</p>
              <p className="text-zinc-300 text-xs">{totalAttendedAcrossAll} / {totalClassesAcrossAll} Classes</p>
            </div>
            <div className="text-3xl font-bold text-blue-500">{overallPercentage}%</div>
          </div>
        </div>
      </header>

      <div className="flex justify-start mb-6">
        <div className="bg-zinc-900 p-1 rounded-xl border border-zinc-800 flex inline-flex">
          <button onClick={() => setViewMode("list")} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${viewMode === "list" ? "bg-zinc-800 text-white shadow" : "text-zinc-400 hover:text-zinc-200"}`}>
            <LayoutList size={16} /> Dashboard
          </button>
          <button onClick={() => setViewMode("calendar")} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${viewMode === "calendar" ? "bg-zinc-800 text-white shadow" : "text-zinc-400 hover:text-zinc-200"}`}>
            <CalendarIcon size={16} /> Timetable
          </button>
        </div>
      </div>

      {viewMode === "list" ? (
        <>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-8 h-[300px]">
            <h2 className="text-white font-semibold mb-4">Monthly Trend</h2>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="name" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', color: '#fff' }} itemStyle={{ color: '#3b82f6' }} />
                <Line type="monotone" dataKey="attendance" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#18181b' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <form onSubmit={addSubject} className="mb-8 bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-3">
              <input type="text" placeholder="Class Name (e.g. History)" value={newSubjectName} onChange={(e) => setNewSubjectName(e.target.value)}
                className="col-span-1 md:col-span-8 bg-zinc-950 border border-zinc-800 text-white p-3 rounded-lg focus:outline-none focus:border-blue-500"
              />
              <div className="relative col-span-1 md:col-span-4">
                <Target className="absolute left-3 top-3.5 text-zinc-500" size={18} />
                <input type="number" placeholder="Target % (Def: 75)" value={newSubjectTarget} onChange={(e) => setNewSubjectTarget(e.target.value)} min="1" max="100"
                  className="w-full bg-zinc-950 border border-zinc-800 text-white py-3 pl-10 pr-4 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
            
            {/* ROW WITH DAYS AND COLOR PICKER */}
            <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center mb-4 p-3 bg-zinc-950/50 rounded-lg border border-zinc-800/50">
              
              {/* Days Selector */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 text-sm text-zinc-400 mr-2">
                  <CalendarDays size={16} /> Schedule:
                </div>
                <div className="flex gap-2 flex-wrap">
                  {weekDays.map((day) => (
                    <button key={day.label} type="button" onClick={() => toggleDay(day.value)}
                      className={`w-10 h-10 rounded-full font-medium transition-all duration-200 shrink-0 ${
                        selectedDays.includes(day.value) ? "bg-blue-600 text-white shadow-[0_0_10px_rgba(37,99,235,0.4)]" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white"
                      }`}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* NEW: Color Selector */}
              <div className="flex items-center gap-2 border-l-0 lg:border-l border-zinc-800 lg:pl-6 pt-4 lg:pt-0 w-full lg:w-auto mt-2 lg:mt-0">
                <div className="flex items-center gap-2 text-sm text-zinc-400 mr-2">
                  <Palette size={16} /> Color:
                </div>
                <div className="flex gap-2">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setNewSubjectColor(c.id)}
                      className={`w-6 h-6 rounded-full ${c.dot} transition-all duration-200 ${
                        newSubjectColor === c.id ? 'ring-2 ring-offset-2 ring-offset-zinc-950 ring-white scale-110' : 'opacity-50 hover:opacity-100'
                      }`}
                    />
                  ))}
                </div>
              </div>

            </div>

            <div className="flex flex-col md:flex-row gap-3 items-center">
              <div className="flex gap-3 w-full md:w-auto flex-1">
                <input type="number" placeholder="Already Attended" value={initialAttended} onChange={(e) => setInitialAttended(e.target.value)} min="0"
                  className="flex-1 bg-zinc-950 border border-zinc-800 text-white p-3 rounded-lg focus:outline-none focus:border-blue-500 text-sm"
                />
                <span className="text-zinc-500 flex items-center">/</span>
                <input type="number" placeholder="Total So Far" value={initialTotal} onChange={(e) => setInitialTotal(e.target.value)} min="0"
                  className="flex-1 bg-zinc-950 border border-zinc-800 text-white p-3 rounded-lg focus:outline-none focus:border-blue-500 text-sm"
                />
              </div>
              <button type="submit" className="w-full md:w-auto bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2">
                <Plus size={20} /> Add Class
              </button>
            </div>
          </form>

          <div className="flex flex-col gap-4">
            <AnimatePresence>
              {subjects.map((subject, index) => {
                const percentage = subject.total === 0 ? 100 : Math.round((subject.attended / subject.total) * 100);
                const isSafe = percentage >= subject.target;
                const prediction = calculatePrediction(subject.attended, subject.total, subject.target);
                const isEditing = editingId === subject.id;
                
                // Fetch the style mapping for this subject's color
                const style = COLOR_OPTIONS.find(c => c.id === subject.color) || COLOR_OPTIONS[0];

                return (
                  <motion.div key={subject.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl flex flex-col gap-4 relative group"
                  >
                    <div className="absolute top-4 right-4 flex gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                      {isEditing ? (
                        <button onClick={() => saveEdit(subject.id)} className="text-emerald-500 hover:text-emerald-400 p-1"><Save size={18} /></button>
                      ) : (
                        <button onClick={() => startEditing(subject)} className="text-zinc-500 hover:text-blue-400 p-1"><Edit2 size={18} /></button>
                      )}
                      <button onClick={() => deleteSubject(subject.id, subject.name)} className="text-zinc-500 hover:text-red-500 p-1"><Trash2 size={18} /></button>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="flex-1 pr-12 md:pr-0">
                        {isEditing ? (
                           <div className="flex gap-2 mb-3">
                             <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="bg-zinc-950 border border-zinc-700 text-white px-2 py-1 rounded text-sm flex-1" />
                             <input type="number" value={editTarget} onChange={(e) => setEditTarget(e.target.value)} className="bg-zinc-950 border border-zinc-700 text-white px-2 py-1 rounded text-sm w-16" />
                           </div>
                        ) : (
                          <div className="flex flex-col gap-1 mb-2">
                            <div className="flex items-center gap-3">
                              {/* VISUAL DOT CONNECTING NAME TO COLOR */}
                              <div className={`w-3 h-3 rounded-full ${style.dot}`} />
                              <h2 className="text-xl font-semibold text-white">{subject.name}</h2>
                              <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-1 rounded-md border border-zinc-700">Target: {subject.target}%</span>
                            </div>
                            <div className="text-xs text-zinc-500 font-medium ml-6">
                              {subject.days.length > 0 
                                ? `Meets on: ${subject.days.map(d => weekDays.find(w => w.value === d)?.label).join(', ')}` 
                                : 'No days scheduled'}
                            </div>
                          </div>
                        )}
                        
                        <p className="text-sm text-zinc-400 mb-4 mt-2">Attended {subject.attended} out of {subject.total} classes</p>
                        
                        <div className="w-full bg-zinc-800 rounded-full h-2.5 mb-2">
                          <motion.div layout className={`h-2.5 rounded-full ${isSafe ? 'bg-emerald-500' : 'bg-red-500'}`} style={{ width: `${percentage}%` }}></motion.div>
                        </div>
                        <p className={`text-xs font-medium ${prediction.color}`}>↳ {prediction.text}</p>
                      </div>

                      <div className="flex items-center justify-between md:justify-end gap-6 mt-2 md:mt-0">
                        <div className={`text-4xl font-bold w-20 text-left md:text-right ${isSafe ? 'text-emerald-500' : 'text-red-500'}`}>
                          {percentage}%
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => markPresent(subject.id)} className="p-3 bg-zinc-800 hover:bg-emerald-500/20 text-emerald-500 rounded-lg transition-colors"><Check size={20} /></button>
                          <button onClick={() => markAbsent(subject.id)} className="p-3 bg-zinc-800 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors"><X size={20} /></button>
                          <button onClick={() => undoAction(subject.id)} className="p-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded-lg transition-colors"><RotateCcw size={20} /></button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </>
      ) : (
        renderCalendar()
      )}
    </main>
  );
}