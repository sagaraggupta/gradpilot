import React, { useState, useEffect, useMemo } from "react";
import StatCard from "../components/ui/StatCard";
import ProgressBar from "../components/ui/ProgressBar";
import Modal from "../components/ui/Modal";
import { Icon, Icons } from "../components/ui/Icon";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

// Mumbai University Engineering Grading Scale
const GRADE_SCALE = {
  "O":  { points: 10, color: "#a855f7", label: "Outstanding (>= 90%)" },  // purple
  "A+": { points: 9,  color: "#4ade80", label: "Excellent (80 - 89%)" },  // green
  "A":  { points: 8,  color: "#34d399", label: "Very Good (70 - 79%)" },  // emerald
  "B+": { points: 7,  color: "#fbbf24", label: "Good (60 - 69%)" },       // amber
  "B":  { points: 6,  color: "#fb923c", label: "Above Avg (55 - 59%)" },  // orange
  "C":  { points: 5,  color: "#f472b6", label: "Average (50 - 54%)" },    // pink
  "D":  { points: 4,  color: "#9ca3af", label: "Pass (40 - 49%)" },       // gray
  "F":  { points: 0,  color: "#f87171", label: "Fail (< 40%)" }           // red
};

export default function Grades() {
  const { user } = useAuth();
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // UI States
  const [selectedSemester, setSelectedSemester] = useState("Semester 1");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  
  const [newGrade, setNewGrade] = useState({
    semester: "Semester 1",
    subject: "",
    credits: 3,
    grade: "A"
  });

  // ─── FETCH DATA ───
  useEffect(() => {
    fetchGrades();
  }, [user]);

  const fetchGrades = async () => {
    setLoading(true);
<<<<<<< HEAD
    const { data, error } = await supabase
      .from('grades')
      .select('*')
      .eq('user_id', user.id) // 🔒 CRITICAL FIX: Scope the query!
      .order('created_at', { ascending: true });
      
=======
    const { data, error } = await supabase.from('grades').select('*').order('created_at', { ascending: true });
>>>>>>> d5c8fd0b23f1e1f126f3ab7cb66827dd5d3393e6
    if (!error && data) {
      setGrades(data);
      const uniqueSems = [...new Set(data.map(g => g.semester))].sort();
      if (uniqueSems.length > 0) setSelectedSemester(uniqueSems[uniqueSems.length - 1]);
    }
    setLoading(false);
  };

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  // ─── HANDLERS ───
  const handleAddGrade = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!newGrade.subject.trim()) newErrors.subject = "Subject name is required.";
    if (Object.keys(newErrors).length > 0) return setErrors(newErrors);

    setIsSubmitting(true);
    const gradeToInsert = {
      user_id: user.id,
      semester: newGrade.semester,
      subject: newGrade.subject,
      credits: Number(newGrade.credits),
      grade: newGrade.grade
    };

    const { data, error } = await supabase.from('grades').insert([gradeToInsert]).select();
    if (!error && data) {
      setGrades(prev => [...prev, data[0]]);
      setSelectedSemester(newGrade.semester); 
      setIsModalOpen(false);
      setNewGrade({ ...newGrade, subject: "" }); 
      showToast("Grade logged successfully!");
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this grade? This will recalculate your GPA.")) return;
    setGrades(prev => prev.filter(g => g.id !== id));
<<<<<<< HEAD
    // 🛡️ FIX: Double-lock the delete query
    await supabase.from('grades').delete().eq('id', id).eq('user_id', user.id);
=======
    await supabase.from('grades').delete().eq('id', id);
>>>>>>> d5c8fd0b23f1e1f126f3ab7cb66827dd5d3393e6
    showToast("Grade removed.");
  };

  // ─── MATH & CALCULATIONS ───
  const calculateGPA = (gradeArray) => {
    if (gradeArray.length === 0) return 0;
    let totalCredits = 0;
    let totalPoints = 0;
    gradeArray.forEach(g => {
      totalCredits += g.credits;
      totalPoints += (g.credits * (GRADE_SCALE[g.grade]?.points || 0));
    });
    return totalCredits === 0 ? 0 : (totalPoints / totalCredits).toFixed(2);
  };

  const semestersList = useMemo(() => {
    const sems = [...new Set(grades.map(g => g.semester))].sort();
    return sems.length > 0 ? sems : ["Semester 1"];
  }, [grades]);

  const currentSemesterGrades = grades.filter(g => g.semester === selectedSemester);
  
  const cgpa = calculateGPA(grades);
  const sgpa = calculateGPA(currentSemesterGrades);
  const totalCreditsEarned = grades.reduce((acc, g) => g.grade !== "F" ? acc + g.credits : acc, 0);
  
  const gradeDistribution = useMemo(() => {
    const dist = {};
    Object.keys(GRADE_SCALE).forEach(k => dist[k] = 0);
    grades.forEach(g => { if(dist[g.grade] !== undefined) dist[g.grade]++; });
    return dist;
  }, [grades]);

  return (
    <div className="flex flex-col gap-5 relative pb-10">
      
      {/* ─── HEADER ─── */}
      <div className="flex justify-between items-center flex-wrap gap-4 bg-white/5 border border-white/10 p-4 rounded-2xl">
        <div>
          <h2 className="text-slate-100 font-bold text-[20px] font-['Sora']">Academic Transcript</h2>
          <p className="text-white/40 text-[13px] mt-0.5">Track your CGPA & Semester Performance</p>
        </div>

        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 text-white text-xs font-bold hover:opacity-90 transition-opacity shadow-lg shadow-indigo-500/20"
        >
          <Icon d={Icons.plus} size={14} /> Add Course Grade
        </button>
      </div>

      {/* ─── OVERALL STAT CARDS ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Cumulative GPA" value={cgpa} sub="Overall CGPA" icon="trophy" color="#a855f7" />
        <StatCard label="Current SGPA" value={sgpa} sub={`${selectedSemester} Average`} icon="chart" color="#4ade80" />
        <StatCard label="Total Credits" value={totalCreditsEarned} sub="Successfully earned" icon="book" color="#fbbf24" />
        <StatCard label="Courses Completed" value={grades.filter(g => g.grade !== "F").length} sub="Across all semesters" icon="check" color="#818cf8" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* ─── LEFT COLUMN: SEMESTER TRANSCRIPT ─── */}
        <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col h-full min-h-[500px]">
          
          {/* Semester Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-4 mb-4 border-b border-white/5 no-scrollbar">
            {semestersList.map(sem => (
              <button 
                key={sem} onClick={() => setSelectedSemester(sem)}
                className={`px-4 py-2 rounded-xl text-[13px] font-bold whitespace-nowrap transition-all duration-200 ${selectedSemester === sem ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'bg-transparent text-white/40 hover:text-white/70 hover:bg-white/5 border border-transparent'}`}
              >
                {sem}
              </button>
            ))}
          </div>

          <div className="flex justify-between items-end mb-4">
            <div>
              <h3 className="text-slate-100 font-semibold text-[16px]">{selectedSemester} Courses</h3>
              <p className="text-[12px] text-white/40 mt-0.5">SGPA: <span className="font-bold text-indigo-400">{sgpa}</span></p>
            </div>
          </div>

          {/* Courses List */}
          <div className="flex-1 overflow-y-auto pr-2 -mr-2">
            {loading ? (
              <div className="text-white/40 text-[13px] py-10 text-center">Loading grades...</div>
            ) : currentSemesterGrades.length === 0 ? (
              <div className="text-white/30 text-[13px] py-16 text-center border border-dashed border-white/10 rounded-xl flex flex-col items-center gap-3">
                <span className="text-3xl">📚</span>
                No courses logged for this semester.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {currentSemesterGrades.map((g) => {
                  const scale = GRADE_SCALE[g.grade];
                  return (
                    <div key={g.id} className="flex justify-between items-center py-3.5 px-4 bg-[#0d0d14] border border-white/5 rounded-xl group hover:border-white/10 transition-colors">
                      <div>
                        <div className="text-[14px] text-slate-200 font-bold">{g.subject}</div>
                        <div className="text-[11px] text-white/40 mt-1 flex items-center gap-2">
                          <span>{g.credits} Credits</span>
                          <span>•</span>
                          <span>{scale.points} Points</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-[20px] font-extrabold tracking-tight leading-none" style={{ color: scale.color }}>{g.grade}</div>
                          <div className="text-[9px] uppercase tracking-widest mt-1" style={{ color: `${scale.color}80` }}>{scale.label}</div>
                        </div>
                        <button onClick={() => handleDelete(g.id)} className="w-8 h-8 rounded-lg bg-red-500/10 text-red-400 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all hover:bg-red-500/20" title="Remove">
                          <Icon d={Icons.x} size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ─── RIGHT COLUMN: INSIGHTS & DISTRIBUTION ─── */}
        <div className="flex flex-col gap-5">
          
          <div className="bg-gradient-to-br from-[#0d0d14] to-[#1a1a2e] border border-indigo-500/20 rounded-2xl p-6 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -mr-10 -mt-10" />
            <h3 className="text-white/40 text-[11px] uppercase tracking-widest font-bold mb-2">Overall Performance</h3>
            <div className="text-[64px] font-extrabold text-white font-['Sora'] leading-none tracking-tighter drop-shadow-[0_0_15px_rgba(129,140,248,0.3)]">
              {cgpa}
            </div>
            <div className="text-[13px] text-indigo-300 font-medium mt-2">Cumulative Grade Point Average</div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex-1">
            <h3 className="text-slate-100 font-semibold text-[15px] mb-5">Grade Distribution</h3>
            {grades.length === 0 ? (
              <div className="text-center text-white/30 text-[12px] py-10">Add grades to see distribution</div>
            ) : (
              <div className="flex flex-col gap-3">
                {Object.entries(GRADE_SCALE).map(([grade, config]) => {
                  const count = gradeDistribution[grade];
                  if (count === 0) return null;
                  const pct = (count / grades.length) * 100;
                  
                  return (
                    <div key={grade}>
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-[12px] font-bold text-slate-300">{grade} <span className="text-white/30 font-normal">({count})</span></span>
                        <span className="text-[11px] font-medium" style={{ color: config.color }}>{Math.round(pct)}%</span>
                      </div>
                      <ProgressBar value={pct} color={config.color} height={6} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ─── ADD GRADE MODAL ─── */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Log Course Grade">
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
                      ? `bg-indigo-500/20 border-indigo-500/50 text-white shadow-md scale-105` 
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

      {/* ─── TOAST NOTIFICATION ─── */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-green-500/10 border border-green-500/30 text-green-400 px-5 py-3 rounded-xl shadow-2xl backdrop-blur-md flex items-center gap-3 animate-[fadeIn_0.3s_ease-out]">
          <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">✓</div>
          <span className="text-[13px] font-bold">{toast}</span>
        </div>
      )}

    </div>
  );
}