import React, { useState, useEffect } from "react";
import { Icon, Icons } from "../components/ui/Icon";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

export default function Timer() {
  const { user } = useAuth();
  
  // ─── DYNAMIC CONFIGURATION ───────────────────────────────────────────────
  const [configs, setConfigs] = useState({
    pomodoro: 25,
    shortBreak: 5,
    longBreak: 15,
    deepWork: 90
  });

  const [mode, setMode] = useState("pomodoro");
  const [running, setRunning] = useState(false);
  const [seconds, setSeconds] = useState(configs.pomodoro * 60);
  const [subject, setSubject] = useState("");
  const [attendanceSubjects, setAttendanceSubjects] = useState([]);
  
  // Stats State
  const [sessionsToday, setSessionsToday] = useState(0);
  const [focusMinutes, setFocusMinutes] = useState(0);

  // Edit State
  const [isEditingTime, setIsEditingTime] = useState(false);

  // ─── FETCH SUBJECTS FROM ATTENDANCE ─────────────────────────────────────
  useEffect(() => {
    const fetchSubjects = async () => {
      const { data } = await supabase.from('attendance').select('subject').eq('user_id', user.id);
      if (data) setAttendanceSubjects(data.map(d => d.subject));
    };
    fetchSubjects();
  }, [user]);

  // ─── TIMER LOGIC ────────────────────────────────────────────────────────
  useEffect(() => {
    let interval = null;
    if (running && seconds > 0) {
      interval = setInterval(() => setSeconds(s => s - 1), 1000);
    } else if (running && seconds === 0) {
      handleSessionComplete();
    }
    return () => clearInterval(interval);
  }, [running, seconds]);

  // When config changes (user edits time), reset the timer
  useEffect(() => {
    if (!running) setSeconds(configs[mode] * 60);
  }, [configs, mode]);

  const switchMode = (m) => { 
    setMode(m); 
    setRunning(false); 
    setSeconds(configs[m] * 60); 
  };

  const handleSessionComplete = () => {
    setRunning(false);
    
    // If we finished a work session, update stats!
    if (mode === "pomodoro" || mode === "deepWork") {
      setSessionsToday(prev => prev + 1);
      setFocusMinutes(prev => prev + configs[mode]);
    }

    // Auto-switch modes (Pomodoro -> Short Break)
    if (mode === "pomodoro") switchMode("shortBreak");
    else if (mode === "shortBreak") switchMode("pomodoro");
  };

  const handleSkip = () => {
    handleSessionComplete(); // Log the time and skip to next
  };

  const handleRestart = () => {
    setRunning(false);
    setSeconds(configs[mode] * 60);
  };

  // ─── EDIT TIME LOGIC ────────────────────────────────────────────────────
  const handleTimeEdit = (newMinutes) => {
    setIsEditingTime(false);
    const mins = Math.max(1, parseInt(newMinutes) || configs[mode]); // Minimum 1 min
    setConfigs(prev => ({ ...prev, [mode]: mins }));
  };

  // ─── MATH FOR UI ────────────────────────────────────────────────────────
  const mins = String(Math.floor(seconds / 60)).padStart(2, "0");
  const secs = String(seconds % 60).padStart(2, "0");
  const totalSecondsForMode = configs[mode] * 60;
  const progress = ((totalSecondsForMode - seconds) / totalSecondsForMode) * 100;
  
  const r = 90; 
  const circumference = 2 * Math.PI * r;

  return (
    <div className="flex flex-col gap-6 items-center pb-10">
      <div className="text-center">
        <h2 className="text-slate-100 font-bold text-[22px] font-['Sora']">Focus Timer</h2>
        <p className="text-white/40 text-[13px] mt-1">Stay in the zone. No distractions.</p>
      </div>

      {/* Mode Selector */}
      <div className="flex flex-wrap justify-center gap-2">
        {Object.keys(configs).map(m => (
          <button 
            key={m} onClick={() => switchMode(m)} 
            className={`px-4 py-2 rounded-full border text-xs font-medium transition-colors ${mode === m ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-400 shadow-md' : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10 hover:text-white/70'}`}
          >
            {{ pomodoro: "Pomodoro", shortBreak: "Short Break", longBreak: "Long Break", deepWork: "Deep Work" }[m]}
          </button>
        ))}
      </div>

      {/* Circle Timer */}
      <div className="relative w-[280px] h-[280px] mt-4">
        <svg width={280} height={280} className="-rotate-90 drop-shadow-[0_0_15px_rgba(99,102,241,0.2)]">
          <circle cx={140} cy={140} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={8} />
          <circle 
            cx={140} cy={140} r={r} fill="none" stroke="url(#timerGrad)" strokeWidth={8} strokeLinecap="round"
            strokeDasharray={circumference} 
            strokeDashoffset={circumference - (progress / 100) * circumference}
            className="transition-[stroke-dashoffset] duration-1000 ease-linear"
          />
          <defs>
            <linearGradient id="timerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
          </defs>
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {isEditingTime ? (
            <input 
              autoFocus
              type="number" 
              defaultValue={configs[mode]} 
              onBlur={(e) => handleTimeEdit(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleTimeEdit(e.target.value)}
              className="bg-[#0d0d14] border border-indigo-500/50 rounded-xl text-center text-[48px] font-extrabold text-indigo-400 font-['Sora'] w-32 outline-none"
            />
          ) : (
            <div 
              onClick={() => { if (!running) setIsEditingTime(true); }}
              className={`text-[56px] font-extrabold text-slate-100 font-['Sora'] tracking-tighter leading-none ${!running && 'cursor-pointer hover:text-indigo-300 transition-colors'}`}
              title={!running ? "Click to edit time" : ""}
            >
              {mins}:{secs}
            </div>
          )}
          
          <div className="text-[11px] font-bold text-white/30 uppercase tracking-widest mt-2">
            {isEditingTime ? 'Press Enter to save' : 'Minutes'}
          </div>
        </div>
      </div>

      {/* Datalist Subject Selector */}
      <div className="w-full max-w-[250px] relative">
        <input 
          type="text" list="timer-subjects" placeholder="What are you working on?"
          value={subject} onChange={e => setSubject(e.target.value)}
          className="w-full bg-[#0d0d14] border border-white/10 rounded-xl px-4 py-3 text-center text-slate-200 text-[13px] outline-none focus:border-indigo-500/50 transition-colors"
        />
        <datalist id="timer-subjects">
          {attendanceSubjects.map(s => <option key={s} value={s} />)}
          <option value="Coding Practice" />
          <option value="Reading" />
        </datalist>
      </div>

      {/* Controls (Restart, Play/Pause, Skip) */}
      <div className="flex items-center gap-6 mt-2">
        <button onClick={handleRestart} className="w-12 h-12 rounded-xl border border-white/10 bg-white/5 text-white/50 hover:bg-white/10 hover:text-white transition-colors text-lg flex items-center justify-center group" title="Restart Timer">
          <span className="group-active:-rotate-90 transition-transform">↺</span>
        </button>
        
        <button onClick={() => setRunning(r => !r)} className="w-[80px] h-[80px] rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 text-white text-3xl flex items-center justify-center shadow-[0_10px_20px_rgba(99,102,241,0.3)] hover:opacity-90 hover:scale-105 active:scale-95 transition-all">
          {running ? "⏸" : "▶"}
        </button>

        <button onClick={handleSkip} className="w-12 h-12 rounded-xl border border-white/10 bg-white/5 text-white/50 hover:bg-white/10 hover:text-white transition-colors text-lg flex items-center justify-center group" title="Skip to next session">
          <span className="group-active:translate-x-1 transition-transform">⏭</span>
        </button>
      </div>

      {/* Dynamic Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-[650px] mt-6">
        {[
          ["Sessions Today", sessionsToday, "🍅"], 
          ["Focus Time", `${Math.floor(focusMinutes / 60)}h ${focusMinutes % 60}m`, "⏱"], 
          ["Streak", "12 days", "🔥"], 
          ["Daily Goal", `${Math.min(100, Math.round((focusMinutes / 120) * 100))}%`, "🎯"] // Assuming 2 hour (120min) goal
        ].map(([l, v, e]) => (
          <div key={l} className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center hover:bg-white/[0.07] transition-colors">
            <div className="text-2xl mb-2 drop-shadow-md">{e}</div>
            <div className="text-[17px] font-bold text-slate-100 font-['Sora'] leading-none mb-1">{v}</div>
            <div className="text-[11px] text-white/40 uppercase tracking-wide">{l}</div>
          </div>
        ))}
      </div>
    </div>
  );
}