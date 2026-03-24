import React, { useState, useEffect } from "react";
import { Icon, Icons } from "../components/ui/Icon";
import Modal from "../components/ui/Modal";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { processActivityXP } from "../lib/streakEngine";

export default function Timer() {
  const { user } = useAuth();
  
  const [configs, setConfigs] = useState({ pomodoro: 25, shortBreak: 5, longBreak: 15, deepWork: 90 });
  const [mode, setMode] = useState("pomodoro");
  const [running, setRunning] = useState(false);
  
  const [seconds, setSeconds] = useState(configs.pomodoro * 60);
  const [targetTime, setTargetTime] = useState(null);
  
  const [pendingTasks, setPendingTasks] = useState([]);
  const [selectedTaskId, setSelectedTaskId] = useState("");
  const [profile, setProfile] = useState(null);
  
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [sessionMood, setSessionMood] = useState(null); 
  
  const [toast, setToast] = useState(null);
  const [isEditingTime, setIsEditingTime] = useState(false);
  
  const [sessionsToday, setSessionsToday] = useState(0);
  const [focusMinutes, setFocusMinutes] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      const { data: tasksData } = await supabase.from('tasks').select('*').eq('user_id', user.id).eq('status', 'pending').order('due', { ascending: true });
      if (tasksData) setPendingTasks(tasksData);

      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (profileData) {
        setProfile(profileData);
        setFocusMinutes(profileData.focus_minutes_today || 0);
        setSessionsToday(profileData.sessions_today || 0); 
      }
    };
    fetchData();
  }, [user]);

  const showToastMessage = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    let interval = null;
    if (running && targetTime) {
      interval = setInterval(() => {
        const remaining = Math.round((targetTime - Date.now()) / 1000);
        
        if (remaining <= 0) {
          setSeconds(0);
          setRunning(false);
          setTargetTime(null);
          handleSessionComplete();
        } else {
          setSeconds(remaining);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [running, targetTime]);

  useEffect(() => {
    if (!running) setSeconds(configs[mode] * 60);
  }, [configs, mode]);

  const toggleTimer = () => {
    if (running) {
      setRunning(false);
      setTargetTime(null);
    } else {
      setTargetTime(Date.now() + (seconds * 1000));
      setRunning(true);
    }
  };

  const switchMode = (m) => { 
    setMode(m); 
    setRunning(false); 
    setTargetTime(null); 
    setSeconds(configs[m] * 60); 
  };

  const handleRestart = () => { 
    setRunning(false); 
    setTargetTime(null); 
    setSeconds(configs[mode] * 60); 
  };

  const handleSkip = () => { 
    setRunning(false); 
    setTargetTime(null); 
    switchMode(mode === "pomodoro" ? "shortBreak" : "pomodoro"); 
  };

  const handleSessionComplete = async () => {
    setRunning(false);
    setTargetTime(null);

    try {
      const chime = new Audio('/chime.mp3'); 
      chime.play().catch(e => console.log("Audio play blocked by browser:", e));
    } catch (e) {
       console.log("Audio not supported");
    }
    
    if (mode === "pomodoro" || mode === "deepWork") {
      setSessionMood(null); 
      setShowCompletionModal(true); 
    } else {
      switchMode("pomodoro");
    }
  };

  const submitSession = async (isTaskCompleted) => {
    if (!sessionMood) {
      alert("Please select how you felt during the session!");
      return;
    }

    try {
      const activeTask = pendingTasks.find(t => t.id === selectedTaskId);
      const subjectToLog = activeTask ? activeTask.subject : "General";

      await supabase.from('study_sessions').insert([{
        user_id: user.id,
        task_id: selectedTaskId || null,
        subject: subjectToLog,
        duration_minutes: configs[mode],
        mood: sessionMood
      }]);

      const res = await processActivityXP(user.id, 20, configs[mode]);
      
      if (isTaskCompleted && selectedTaskId) {
        await supabase.from('tasks').update({ status: 'completed', progress: 100, completed_at: new Date().toISOString() }).eq('id', selectedTaskId);
        const taskRes = await processActivityXP(user.id, 50, 0); 
        
        setProfile({ ...profile, total_xp: taskRes.newXp, current_streak: taskRes.newStreak, focus_minutes_today: res.newFocus, sessions_today: res.newSessions });
        setPendingTasks(prev => prev.filter(t => t.id !== selectedTaskId));
        setSelectedTaskId("");
        showToastMessage(taskRes?.streakExtendedToday ? `Task complete! Streak extended! 🔥` : "Task completed! +70 XP Total");
      } else {
        setProfile({ ...profile, total_xp: res.newXp, current_streak: res.newStreak, focus_minutes_today: res.newFocus, sessions_today: res.newSessions });
        showToastMessage(res?.streakExtendedToday ? `+20 XP! Streak extended to ${res.newStreak} days! 🔥` : "+20 XP for focusing!");
      }

      setFocusMinutes(res.newFocus);
      setSessionsToday(res.newSessions);
      setShowCompletionModal(false);
      switchMode("shortBreak"); 
      
    } catch (error) {
      console.error("Failed to save session:", error);
      showToastMessage("Network error: Failed to save session. Try again.");
    }
  };

  // ─── BUG FIX: PREVENT DOUBLE RENDER ON ENTER + BLUR ───
  const handleTimeEdit = (newMinutes) => {
    if (!isEditingTime) return; // Prevent double execution
    setIsEditingTime(false);
    const mins = Math.max(1, parseInt(newMinutes) || configs[mode]);
    setConfigs(prev => ({ ...prev, [mode]: mins }));
  };

  const mins = String(Math.floor(seconds / 60)).padStart(2, "0");
  const secs = String(seconds % 60).padStart(2, "0");
  const totalSecondsForMode = configs[mode] * 60;
  const progress = ((totalSecondsForMode - seconds) / totalSecondsForMode) * 100;
  const r = 90; 
  const circumference = 2 * Math.PI * r;
  const activeTask = pendingTasks.find(t => t.id === selectedTaskId);

  return (
    <div className="flex flex-col gap-6 items-center pb-10 relative">
      <div className="text-center">
        <h2 className="text-slate-100 font-bold text-[22px] font-['Plus_Jakarta_Sans']">Focus Timer</h2>
        <p className="text-white/40 text-[13px] mt-1">Stay in the zone. Earn XP.</p>
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        {Object.keys(configs).map(m => (
          <button key={m} onClick={() => switchMode(m)} className={`px-4 py-2 rounded-full border text-xs font-medium transition-colors ${mode === m ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-400 shadow-md' : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10 hover:text-white/70'}`}>
            {{ pomodoro: "Pomodoro", shortBreak: "Short Break", longBreak: "Long Break", deepWork: "Deep Work" }[m]}
          </button>
        ))}
      </div>

      <div className="relative w-[280px] h-[280px] mt-4">
        <svg width={280} height={280} className="-rotate-90 drop-shadow-[0_0_15px_rgba(99,102,241,0.2)]">
          <circle cx={140} cy={140} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={8} />
          <circle cx={140} cy={140} r={r} fill="none" stroke="url(#timerGrad)" strokeWidth={8} strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference - (progress / 100) * circumference} className="transition-[stroke-dashoffset] duration-1000 ease-linear" />
          <defs><linearGradient id="timerGrad" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#6366f1" /><stop offset="100%" stopColor="#a855f7" /></linearGradient></defs>
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {isEditingTime ? (
            <input autoFocus type="number" defaultValue={configs[mode]} onBlur={(e) => handleTimeEdit(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleTimeEdit(e.target.value)} className="bg-[#0d0d14] border border-indigo-500/50 rounded-xl text-center text-[48px] font-extrabold text-indigo-400 font-['Plus_Jakarta_Sans'] w-32 outline-none" />
          ) : (
            <div onClick={() => { if (!running) setIsEditingTime(true); }} className={`text-[56px] font-extrabold text-slate-100 font-['Plus_Jakarta_Sans'] tracking-tighter leading-none ${!running && 'cursor-pointer hover:text-indigo-300 transition-colors'}`} title={!running ? "Click to edit time" : ""}>
              {mins}:{secs}
            </div>
          )}
          <div className="text-[11px] font-bold text-white/30 uppercase tracking-widest mt-2">{isEditingTime ? 'Press Enter to save' : 'Minutes'}</div>
        </div>
      </div>

      <div className="w-full max-w-[300px] relative">
        <select value={selectedTaskId} onChange={e => setSelectedTaskId(e.target.value)} className={`w-full bg-[#0d0d14] border rounded-xl px-4 py-3 text-center text-[13px] outline-none transition-colors appearance-none cursor-pointer ${selectedTaskId ? 'border-indigo-500/50 text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.1)]' : 'border-white/10 text-white/40 hover:border-white/20'}`}>
          <option value="">🎯 General Focus Session</option>
          {pendingTasks.map(task => <option key={task.id} value={task.id}>{task.subject}: {task.title}</option>)}
        </select>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/30">▼</div>
      </div>

      <div className="flex items-center gap-6 mt-2">
        <button onClick={handleRestart} className="w-12 h-12 rounded-xl border border-white/10 bg-white/5 text-white/50 hover:bg-white/10 hover:text-white transition-colors text-lg flex items-center justify-center group" title="Restart Timer"><span className="group-active:-rotate-90 transition-transform">↺</span></button>
        <button onClick={toggleTimer} className="w-[80px] h-[80px] rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 text-white text-3xl flex items-center justify-center shadow-[0_10px_20px_rgba(99,102,241,0.3)] hover:opacity-90 hover:scale-105 active:scale-95 transition-all"><Icon d={running ? Icons.pause : Icons.play} size={32} className={running ? "" : "ml-1"} /></button>
        <button onClick={handleSkip} className="w-12 h-12 rounded-xl border border-white/10 bg-white/5 text-white/50 hover:bg-white/10 hover:text-white transition-colors text-lg flex items-center justify-center group" title="Skip to next session"><Icon d={Icons.skip} size={20} className="group-active:translate-x-1 transition-transform" /></button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-[650px] mt-6">
        {[
          ["Sessions Today", sessionsToday, "🍅"], 
          ["Focus Time", `${Math.floor(focusMinutes / 60)}h ${focusMinutes % 60}m`, "⏱"], 
          ["Streak", `${profile?.current_streak || 0} days`, "🔥"], 
          ["Daily Goal", `${Math.min(100, Math.round((focusMinutes / (profile?.daily_focus_goal || 120)) * 100))}%`, "🎯"]
        ].map(([l, v, e]) => (
          <div key={l} className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center hover:bg-white/[0.07] transition-colors">
            <div className="text-2xl mb-2 drop-shadow-md">{e}</div>
            <div className="text-[17px] font-bold text-slate-100 font-['Plus_Jakarta_Sans'] leading-none mb-1">{v}</div>
            <div className="text-[11px] text-white/40 uppercase tracking-wide">{l}</div>
          </div>
        ))}
      </div>

      <Modal isOpen={showCompletionModal} onClose={() => { setShowCompletionModal(false); switchMode("shortBreak"); }} title="Focus Session Complete!">
        <div className="flex flex-col items-center text-center gap-5 py-2">
          
          <div className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl">
            <h3 className="text-[14px] font-bold text-slate-100 mb-3">How did this session feel?</h3>
            <div className="flex gap-3 justify-center">
              {[
                { id: 'great', emoji: '🟢', label: 'Felt Great' },
                { id: 'okay', emoji: '🟡', label: 'Okay' },
                { id: 'struggled', emoji: '🔴', label: 'Struggled' }
              ].map(mood => (
                <button 
                  key={mood.id}
                  onClick={() => setSessionMood(mood.id)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all flex-1
                    ${sessionMood === mood.id ? 'bg-indigo-500/20 border-indigo-500/50 shadow-md scale-105' : 'bg-[#0d0d14] border-white/5 opacity-60 hover:opacity-100'}`}
                >
                  <span className="text-2xl">{mood.emoji}</span>
                  <span className={`text-[11px] font-bold ${sessionMood === mood.id ? 'text-indigo-300' : 'text-white/50'}`}>{mood.label}</span>
                </button>
              ))}
            </div>
          </div>

          {activeTask ? (
            <div className="w-full mt-2">
              <p className="text-[13px] text-white/60 mb-4">
                You were focusing on <strong className="text-indigo-400">"{activeTask.title}"</strong>. Cross it off your list?
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
                <button onClick={() => submitSession(false)} className="py-3 px-4 rounded-xl border border-white/10 text-white/60 hover:text-white hover:bg-white/5 font-semibold text-[13px] transition-colors">
                  Need more time
                </button>
                <button onClick={() => submitSession(true)} className="py-3 px-4 rounded-xl bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30 font-bold text-[13px] flex items-center justify-center gap-2 transition-colors">
                  <Icon d={Icons.check} size={16} /> Mark Completed
                </button>
              </div>
            </div>
          ) : (
            <button 
              onClick={() => submitSession(false)} 
              className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 text-white font-bold text-[14px] hover:opacity-90 transition-opacity"
            >
              Save & Take a Break (+20 XP)
            </button>
          )}

        </div>
      </Modal>

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-green-500/10 border border-green-500/30 text-green-400 px-5 py-3 rounded-xl shadow-2xl backdrop-blur-md flex items-center gap-3 animate-[fadeIn_0.3s_ease-out]">
          <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">✓</div>
          <span className="text-[13px] font-medium">{toast}</span>
        </div>
      )}
    </div>
  );
}