import React, { useState, useEffect, useMemo } from "react";
import StatCard from "../components/ui/StatCard";
import ProgressBar from "../components/ui/ProgressBar";
import Modal from "../components/ui/Modal";
import { Icon, Icons } from "../components/ui/Icon";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import AddGradeModal from "../components/grades/AddGradeModal";
import GradeInsights from "../components/grades/GradeInsights";
import SemesterTranscript from "../components/grades/SemesterTranscript";
import CGPAPredictor from "../components/grades/CGPAPredictor";
import KTTracker from "../components/grades/KTTracker";
import AIAcademicAdvisor from "../components/grades/AIAcademicAdvisor";

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

  useEffect(() => {
    document.title = "Grades | GradPilot";
  }, []);

  // ─── FETCH DATA ───
  useEffect(() => {
    if (!user?.id) return; // 🐛 Bug 1 Fix: CRITICAL Null guard
    fetchGrades();
  }, [user]);

  const fetchGrades = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('grades')
      .select('*')
      .eq('user_id', user.id) 
      .order('created_at', { ascending: true });
      
    // 🐛 Bug 2 Fix: Safe Error Handling
    if (error) {
      console.error("Fetch grades error:", error);
      showToast("Failed to load grades. Please try again.");
    } else if (data) {
      setGrades(data);
      // 🐛 Bug 4 Fix: Safe Numeric Sorting for Semesters
      const uniqueSems = [...new Set(data.map(g => g.semester))].sort((a, b) => {
        return parseInt(a.split(" ")[1]) - parseInt(b.split(" ")[1]);
      });
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
    
    // 🐛 Bug 5 Fix: Prevent Duplicate Subjects in the same semester
    const isDuplicate = grades.some(g => 
      g.semester === newGrade.semester && 
      g.subject.toLowerCase().trim() === newGrade.subject.toLowerCase().trim()
    );
    if (isDuplicate) newErrors.subject = `${newGrade.subject} is already logged in ${newGrade.semester}.`;
    
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
    
    if (error) {
      showToast("Failed to save grade.");
    } else if (data) {
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
    
    // 🐛 Bug 3 Fix: Store previous state for rollback
    const previousGrades = [...grades];
    setGrades(prev => prev.filter(g => g.id !== id)); // Optimistic UI
    
    const { error } = await supabase.from('grades').delete().eq('id', id).eq('user_id', user.id);
    
    if (error) {
      setGrades(previousGrades); // Rollback!
      showToast("Failed to delete grade. Try again.");
    } else {
      showToast("Grade removed.");
    }
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
    const sems = [...new Set(grades.map(g => g.semester))];
    // 🐛 Bug 4 Fix: Numeric sort for UI Tabs
    sems.sort((a, b) => parseInt(a.split(" ")[1]) - parseInt(b.split(" ")[1]));
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
        
        {/* 📜 MODULAR LEFT COLUMN */}
        <SemesterTranscript 
          semestersList={semestersList}
          selectedSemester={selectedSemester}
          setSelectedSemester={setSelectedSemester}
          sgpa={sgpa}
          loading={loading}
          currentSemesterGrades={currentSemesterGrades}
          GRADE_SCALE={GRADE_SCALE}
          handleDelete={handleDelete}
        />

        {/* 📊 MODULAR RIGHT COLUMN */}
        <GradeInsights 
          cgpa={cgpa}
          grades={grades}
          gradeDistribution={gradeDistribution}
          GRADE_SCALE={GRADE_SCALE}
        />

      </div>

      {/* 🚀 MODULAR STRATEGY ENGINE (PREDICTOR) */}
      {grades.length > 0 && (
        <CGPAPredictor 
          grades={grades} 
          GRADE_SCALE={GRADE_SCALE} 
          currentCgpa={cgpa} 
        />
      )}

      {/* 🚨 MODULAR KT & BACKLOG TRACKER */}
      {grades.length > 0 && (
        <KTTracker grades={grades} />
      )}

      {/* 🧠 MODULAR AI ACADEMIC ADVISOR */}
      {grades.length > 0 && (
        <AIAcademicAdvisor cgpa={cgpa} grades={grades} />
      )}

      {/* 🗔 MODULAR ADD GRADE MODAL */}
      <AddGradeModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        handleAddGrade={handleAddGrade}
        newGrade={newGrade}
        setNewGrade={setNewGrade}
        errors={errors}
        setErrors={setErrors}
        isSubmitting={isSubmitting}
        GRADE_SCALE={GRADE_SCALE}
      />

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