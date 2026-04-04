import React, { useState, useEffect } from "react";
import { Icon, Icons } from "../components/ui/Icon";
import Modal from "../components/ui/Modal";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { processActivityXP } from "../lib/streakEngine";
import AIFocusCoach from "../components/timer/AIFocusCoach";
import FocusStats from "../components/timer/FocusStats";
import CompletionModal from "../components/timer/CompletionModal";
import ZenModeOverlay from "../components/timer/ZenModeOverlay";
import AmbientSounds from "../components/timer/AmbientSounds";
import SessionAnalytics from "../components/timer/SessionAnalytics";

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

  const [studyHistory, setStudyHistory] = useState([]);

  // ─── 🚀 SMART MODE & AI STATE ───
  const [pomoCount, setPomoCount] = useState(0);
  const breakTips = ["Drink a glass of water 💧", "Do a quick 2-minute stretch 🧘‍♂️", "Rest your eyes - look 20 feet away 👀", "Take a short walk around the room 🚶‍♂️", "Do 5 deep breaths 🌬️"];
  const [currentTip, setCurrentTip] = useState(breakTips[0]);

  // ─── ZEN MODE & SPOTIFY STATE (With LocalStorage Memory) ───
  const [isZenMode, setIsZenMode] = useState(false);
  
  const [spotifyUrl, setSpotifyUrl] = useState(() => {
    return localStorage.getItem('gradpilot_spotify') || ""; 
  });

  // Auto-save the playlist URL whenever the user changes it
  useEffect(() => {
    localStorage.setItem('gradpilot_spotify', spotifyUrl);
  }, [spotifyUrl]); 

  const toggleZenMode = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsZenMode(true);
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
        setIsZenMode(false);
      }
    } catch (err) {
      console.error("Fullscreen failed:", err);
    }
  };

  // 🎵 SPOTIFY AUTO-CONVERTER
  const handleSpotifyUrlChange = (inputUrl) => {
    if (!inputUrl) {
      setSpotifyUrl("");
      return;
    }
    
    let finalUrl = inputUrl;
    
    // Auto-convert standard Spotify links to embed links
    if (inputUrl.includes("open.spotify.com") && !inputUrl.includes("/embed/")) {
      try {
        const urlObj = new URL(inputUrl);
        // Extracts the "/playlist/123" part and injects "/embed"
        finalUrl = `https://open.spotify.com/embed${urlObj.pathname}?theme=0`;
      } catch (e) {
        console.warn("Invalid URL format");
      }
    } 
    // If they DID paste an embed link, force the dark mode theme!
    else if (inputUrl.includes("/embed/") && !inputUrl.includes("theme=0")) {
      finalUrl = inputUrl.includes("?") ? `${inputUrl}&theme=0` : `${inputUrl}?theme=0`;
    }
    
    setSpotifyUrl(finalUrl);
  };

  // Sync React state if the user presses the 'Esc' key to exit
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) setIsZenMode(false);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // 🚀 MAGIC 1: Update the Browser Tab Title with the countdown!
  useEffect(() => {
    const mins = String(Math.floor(seconds / 60)).padStart(2, "0");
    const secs = String(seconds % 60).padStart(2, "0");
    if (running) {
      document.title = `${mins}:${secs} - Focus | GradPilot`;
    } else {
      document.title = "Focus Timer | GradPilot";
    }
  }, [seconds, running]);

  // ─── 🛡️ SAFE DATA FETCHING & OFFLINE SYNC ───
  useEffect(() => {
    if (!user?.id) return;

    const fetchData = async () => {
      try {
        // 1. Fetch Tasks & Profile
        const { data: tasksData } = await supabase.from('tasks').select('*').eq('user_id', user.id).eq('status', 'pending');
        if (tasksData) setPendingTasks(tasksData);

        const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (profileData) {
          setProfile(profileData);
          
          // 🛠️ THE FIX: Define the local date string so the app knows what "today" is
          const d = new Date();
          const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          
          if (profileData.last_active_date === todayStr) {
            setFocusMinutes(profileData.focus_minutes_today || 0);
            setSessionsToday(profileData.sessions_today || 0); 
          } else {
            // It's a new day! Override the stale database data with 0 in the UI.
            setFocusMinutes(0);
            setSessionsToday(0);
          }
        }

        // 2. Fetch History for Analytics
        const { data: historyData } = await supabase.from('study_sessions').select('duration_minutes, mood').eq('user_id', user.id);
        if (historyData) setStudyHistory(historyData);

        // 3. 🛜 OFFLINE SYNC CHECK
        const offlineSessions = JSON.parse(localStorage.getItem('gradpilot_offline_sessions') || "[]");
        if (offlineSessions.length > 0 && navigator.onLine) {
          console.log("Syncing offline sessions to cloud...");
          await supabase.from('study_sessions').insert(offlineSessions);
          localStorage.removeItem('gradpilot_offline_sessions');
          showToastMessage(`Synced ${offlineSessions.length} offline sessions to the cloud! ☁️`);
        }

      } catch (err) {
        console.error("Critical fetch failure:", err);
      }
    };
    
    fetchData();
    
    // Listen for internet returning
    window.addEventListener('online', fetchData);
    return () => window.removeEventListener('online', fetchData);
  }, [user]);

  const showToastMessage = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  // ─── 🛡️ BULLETPROOF INTERVAL & EXIT BLOCKER (Bugs 4, 5 & Improvement 8) ───
  useEffect(() => {
    let interval = null;
    
    // 🐛 Bug 4 Fix: Guard clause to prevent duplicate/ghost intervals
    if (!running || !targetTime) return;

    interval = setInterval(() => {
      const remaining = Math.round((targetTime - Date.now()) / 1000);
      
      if (remaining <= 0) {
        setSeconds(0);
        handleSessionComplete(); 
      } else {
        setSeconds(remaining);
      }
    }, 1000);

    // 🐛 Bug 5 Fix: Strict cleanup on unmount or state change
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [running, targetTime]);

  // 🚀 Improvement 8: Prevent Accidental Tab Closing
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (running) {
        e.preventDefault();
        e.returnValue = "You have an active focus session. Are you sure you want to leave?";
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [running]);

  useEffect(() => {
    if (!running) setSeconds(configs[mode] * 60);
  }, [configs, mode]);

  const toggleTimer = () => {
    if (running) {
      setRunning(false);
      setTargetTime(null);
    } else {
      // 🐛 Bug 2 Fix: Safely check if Notifications exist in the browser
      if ("Notification" in window && Notification.permission === "default") {
        Notification.requestPermission().catch(e => console.warn("Notifications blocked."));
      }
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

    // 🐛 Bug 3 Fix: Graceful audio fallback
    try {
      const chime = new Audio('/chime.mp3'); 
      await chime.play();
    } catch (e) { 
      console.warn("Browser blocked auto-play audio."); 
    }

    // 🐛 Bug 2 Fix: Safe Notification Trigger
    if ("Notification" in window && Notification.permission === "granted") {
      try {
        new Notification(mode === "pomodoro" || mode === "deepWork" ? "Focus Session Complete!" : "Break is over!", {
          body: mode === "pomodoro" || mode === "deepWork" ? "Great job! Click here to log your session." : "Time to get back to work!",
          icon: "/pwa-192x192.png"
        });
      } catch (e) {
        console.warn("Notification failed to fire.");
      }
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

      // 1. Save Session (🐛 Bug 6 Fix: Strict Error Catching)
      const { error: sessionError } = await supabase.from('study_sessions').insert([{
        user_id: user.id, task_id: selectedTaskId || null, subject: subjectToLog, duration_minutes: configs[mode], mood: sessionMood
      }]);
      
      if (sessionError) throw sessionError; // This will trigger the catch block below!

      // 2. Process Standard XP
      const res = await processActivityXP(user.id, 20, configs[mode]);
      let finalToastMessage = res?.streakExtendedToday ? `+20 XP! Streak extended to ${res.newStreak} days! 🔥` : "+20 XP for focusing!";
      
      if (isTaskCompleted && selectedTaskId) {
        await supabase.from('tasks').update({ status: 'completed', progress: 100, completed_at: new Date().toISOString() }).eq('id', selectedTaskId);
        const taskRes = await processActivityXP(user.id, 50, 0); 
        setProfile({ ...profile, total_xp: taskRes.newXp, current_streak: taskRes.newStreak, focus_minutes_today: res.newFocus, sessions_today: res.newSessions });
        setPendingTasks(prev => prev.filter(t => t.id !== selectedTaskId));
        setSelectedTaskId("");
        finalToastMessage = "Task completed! +70 XP Total 🎯";
      } else {
        setProfile({ ...profile, total_xp: res.newXp, current_streak: res.newStreak, focus_minutes_today: res.newFocus, sessions_today: res.newSessions });
      }

      setFocusMinutes(res.newFocus);
      setSessionsToday(res.newSessions);

      // 🚀 MAGIC 4: AUTO-VERIFY DAILY QUESTS!
      const todayStr = new Date().toISOString().split('T')[0];
      
      // Check for Pomodoro Quest (If they hit 2 sessions today)
      if (res.newSessions >= 2) {
        const { data: pomoQuest } = await supabase.from('daily_quests').select('*')
          .eq('user_id', user.id).eq('assigned_date', todayStr).eq('title', 'Complete 2 Pomodoro Sessions').eq('is_completed', false).maybeSingle();
          
        if (pomoQuest) {
          await supabase.from('daily_quests').update({ is_completed: true }).eq('id', pomoQuest.id);
          finalToastMessage = `Quest Complete! +${pomoQuest.xp_reward + 20} XP 🎉`;
        }
      }

      // Check for Streak Quest (If they hit a 3-day streak)
      if (res.newStreak >= 3) {
        const { data: streakQuest } = await supabase.from('daily_quests').select('*')
          .eq('user_id', user.id).eq('assigned_date', todayStr).eq('title', 'Achieve a 3-day focus streak').eq('is_completed', false).maybeSingle();
          
        if (streakQuest) {
          await supabase.from('daily_quests').update({ is_completed: true }).eq('id', streakQuest.id);
        }
      }

      showToastMessage(finalToastMessage);
      setShowCompletionModal(false);
      
      // 🚀 SMART MODE ROUTING & BREAK TIPS
      setCurrentTip(breakTips[Math.floor(Math.random() * breakTips.length)]);
      
      if (mode === "pomodoro") {
        const newCount = pomoCount + 1;
        setPomoCount(newCount);
        if (newCount % 4 === 0) {
          switchMode("longBreak");
          showToastMessage("4 Sessions complete! You earned a Long Break. 🏆");
        } else {
          switchMode("shortBreak");
        }
      } else if (mode === "deepWork") {
        switchMode("longBreak"); // Deep work always gets a long recovery
      } 
      
    } catch (error) {
      console.error("Failed to save session to cloud:", error);
      
      // 🛜 THE OFFLINE FALLBACK ENGINE
      if (!navigator.onLine || error.message === "Failed to fetch") {
        const offlineSession = {
          user_id: user.id, task_id: selectedTaskId || null, subject: subjectToLog, 
          duration_minutes: configs[mode], mood: sessionMood, created_at: new Date().toISOString()
        };
        const existingOffline = JSON.parse(localStorage.getItem('gradpilot_offline_sessions') || "[]");
        localStorage.setItem('gradpilot_offline_sessions', JSON.stringify([...existingOffline, offlineSession]));
        
        showToastMessage("You are offline. Session saved locally! 💾");
        setShowCompletionModal(false);
        switchMode("shortBreak");
      } else {
        showToastMessage("Network error: Failed to save session.");
      }
    }
  };

  const handleTimeEdit = (newMinutes) => {
    if (!isEditingTime) return; 
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
      {/* 🧘‍♂️ MODULAR ZEN MODE */}
      <ZenModeOverlay 
        isZenMode={isZenMode}
        toggleZenMode={toggleZenMode}
        mins={mins}
        secs={secs}
        running={running}
        toggleTimer={toggleTimer}
        spotifyUrl={spotifyUrl}
        // setSpotifyUrl={setSpotifyUrl}
        setSpotifyUrl={handleSpotifyUrlChange}
      />

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

      {/* 🚀 HEALTHY BREAK SUGGESTION */}
      {(mode === "shortBreak" || mode === "longBreak") && !running && (
        <div className="mt-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[12px] font-bold animate-[fadeIn_0.5s_ease-out]">
          💡 Tip: {currentTip}
        </div>
      )}

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
            <div onClick={() => { if (!running) setIsEditingTime(true); }} className={`text-[56px] font-extrabold text-slate-100 font-['Plus_Jakarta_Sans'] tracking-tighter leading-none ${!running ? 'cursor-pointer hover:text-indigo-300 transition-colors' : ''}`} title={!running ? "Click to edit time" : ""}>
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

      <div className="flex flex-col items-center gap-6 mt-2">
        {/* Standard Controls */}
        <div className="flex items-center gap-6">
          <button onClick={handleRestart} className="w-12 h-12 rounded-xl border border-white/10 bg-white/5 text-white/50 hover:bg-white/10 hover:text-white transition-colors text-lg flex items-center justify-center group" title="Restart Timer"><span className="group-active:-rotate-90 transition-transform">↺</span></button>
          <button onClick={toggleTimer} className="w-[80px] h-[80px] rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 text-white text-3xl flex items-center justify-center shadow-[0_10px_20px_rgba(99,102,241,0.3)] hover:opacity-90 hover:scale-105 active:scale-95 transition-all"><Icon d={running ? Icons.pause : Icons.play} size={32} className={running ? "" : "ml-1"} /></button>
          <button onClick={handleSkip} className="w-12 h-12 rounded-xl border border-white/10 bg-white/5 text-white/50 hover:bg-white/10 hover:text-white transition-colors text-lg flex items-center justify-center group" title="Skip to next session"><Icon d={Icons.skip} size={20} className="group-active:translate-x-1 transition-transform" /></button>
        </div>

        {/* 🚀 NEW ZEN MODE BUTTON */}
        <button 
          onClick={toggleZenMode}
          className="px-6 py-2.5 rounded-xl bg-indigo-500/10 text-indigo-300 font-bold text-[12px] uppercase tracking-wider border border-indigo-500/30 hover:bg-indigo-500/20 transition-all shadow-lg flex items-center gap-2"
        >
          <span className="text-base">🧘‍♂️</span> Enter Zen Mode
        </button>
      </div>

      {/* 🎧 MODULAR AMBIENT SOUNDS */}
      <AmbientSounds />

      {/* 📊 MODULAR STATS GRID */}
      <FocusStats 
        sessionsToday={sessionsToday}
        focusMinutes={focusMinutes}
        currentStreak={profile?.current_streak || 0}
        dailyFocusGoal={profile?.daily_focus_goal || 120}
      />

      {/* 📈 LIFETIME ANALYTICS */}
      <SessionAnalytics studyHistory={studyHistory} />

      {/* 🚀 THE AI FOCUS COACH */}
      <AIFocusCoach 
        focusMinutes={focusMinutes} 
        sessionsToday={sessionsToday} 
        currentStreak={profile?.current_streak || 0} 
      />

      {/* 🗔 MODULAR COMPLETION MODAL */}
      <CompletionModal 
        isOpen={showCompletionModal}
        onClose={() => { setShowCompletionModal(false); switchMode("shortBreak"); }}
        sessionMood={sessionMood}
        setSessionMood={setSessionMood}
        activeTask={activeTask}
        submitSession={submitSession}
      />

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-green-500/10 border border-green-500/30 text-green-400 px-5 py-3 rounded-xl shadow-2xl backdrop-blur-md flex items-center gap-3 animate-[fadeIn_0.3s_ease-out]">
          <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">✓</div>
          <span className="text-[13px] font-medium">{toast}</span>
        </div>
      )}
    </div>
  );
}