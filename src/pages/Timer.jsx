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

  // ─── ZEN MODE & SPOTIFY STATE (With LocalStorage Memory) ───
  const [isZenMode, setIsZenMode] = useState(false);
  
  const [spotifyUrl, setSpotifyUrl] = useState(() => {
    return localStorage.getItem('gradpilot_spotify') || ""; 
  });

  // Auto-save the playlist URL whenever the user changes it
  useEffect(() => {
    localStorage.setItem('gradpilot_spotify', spotifyUrl);
  }, [spotifyUrl]); 

  // Helper to securely convert standard Spotify share links into Embed UI links
  const getSpotifyEmbedUrl = (link) => {
    const defaultEmbed = "https://open.spotify.com/embed/playlist/0vvXsWCC9xrXsKd4FyS8kM?theme=0";
    if (!link) return defaultEmbed;
    if (link.includes('/embed/')) return link; 
    
    try {
      const url = new URL(link);
      // Extracts just the "/playlist/ID" or "/track/ID" part and injects /embed
      return `https://open.spotify.com/embed${url.pathname}?theme=0`;
    } catch (e) {
      return defaultEmbed; 
    }
  };

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
        // By calculating from Date.now(), we bypass browser throttling freezing the time!
        const remaining = Math.round((targetTime - Date.now()) / 1000);
        
        if (remaining <= 0) {
          setSeconds(0);
          handleSessionComplete(); // Trigger completion
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
      // 🚀 MAGIC 2: Ask permission to send Desktop Notifications the first time they click play
      if (Notification.permission === "default") {
        Notification.requestPermission();
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

    // 1. Try to play audio (Might be blocked if tab is hidden)
    try {
      const chime = new Audio('/chime.mp3'); 
      chime.play().catch(e => console.log("Audio blocked by browser"));
    } catch (e) { }

    // 🚀 MAGIC 3: Fire a Native Desktop Notification! (This works even if minimized!)
    if (Notification.permission === "granted") {
      new Notification(mode === "pomodoro" || mode === "deepWork" ? "Focus Session Complete!" : "Break is over!", {
        body: mode === "pomodoro" || mode === "deepWork" ? "Great job! Click here to log your session." : "Time to get back to work!",
        icon: "/pwa-192x192.png"
      });
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

      // 1. Save Session
      await supabase.from('study_sessions').insert([{
        user_id: user.id, task_id: selectedTaskId || null, subject: subjectToLog, duration_minutes: configs[mode], mood: sessionMood
      }]);

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
      switchMode("shortBreak"); 
      
    } catch (error) {
      console.error("Failed to save session:", error);
      showToastMessage("Network error: Failed to save session. Try again.");
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
      {/* ─── ZEN MODE FULLSCREEN OVERLAY ─── */}
      {isZenMode && (
        <div className="fixed inset-0 z-[100] bg-[#050508] flex flex-col items-center justify-center animate-[fadeIn_0.5s_ease-out]">
          
          {/* Ambient Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center">
            <div className="text-[12px] font-bold text-indigo-400 tracking-[0.3em] uppercase mb-8">
              Deep Focus Mode
            </div>

            {/* MASSIVE TIMER */}
            <div className="text-[150px] md:text-[200px] font-extrabold text-white leading-none tracking-tight mb-16 drop-shadow-2xl font-['Plus_Jakarta_Sans']">
              {mins}:{secs}
            </div>

            {/* CONTROLS (🐛 BUG FIX: Added mb-16 here for perfect spacing!) */}
            <div className="flex items-center gap-8 mb-16">
              <button
                onClick={toggleTimer} 
                className="w-20 h-20 rounded-full bg-white text-black flex items-center justify-center text-4xl hover:scale-105 transition-transform shadow-[0_0_40px_rgba(255,255,255,0.3)]"
              >
                <Icon d={running ? Icons.pause : Icons.play} size={32} className={running ? "" : "ml-1"} />
              </button>

              <button
                onClick={toggleZenMode}
                className="px-6 py-4 rounded-full bg-white/5 text-white/50 font-bold text-[14px] hover:bg-white/10 hover:text-white transition-all border border-white/10"
              >
                Exit Zen Mode (Esc)
              </button>
            </div>

            {/* 🎧 THE SPOTIFY LOFI PLAYER (With SaaS Empty State) */}
            <div className="w-full max-w-[400px] flex flex-col items-center animate-[fadeIn_1s_ease-out_0.5s_both]">
              
              {spotifyUrl ? (
                /* The Active Player */
                <div className="w-full h-[152px]">
                  <iframe 
                    style={{ borderRadius: '16px' }} 
                    src={getSpotifyEmbedUrl(spotifyUrl)} 
                    width="100%" 
                    height="100%" 
                    frameBorder="0" 
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
                    loading="lazy"
                    className="shadow-2xl border border-white/10 bg-[#282828]"
                  ></iframe>
                </div>
              ) : (
                /* The Premium Empty State */
                <div className="w-full h-[152px] rounded-[16px] border border-dashed border-white/20 bg-white/[0.02] flex flex-col items-center justify-center text-center p-6 shadow-2xl">
                  <span className="text-3xl mb-2 opacity-50">🎧</span>
                  <div className="text-[13px] font-bold text-white/70">Connect Your Flow State</div>
                  <div className="text-[11px] text-white/40 mt-1">Paste a Spotify playlist link below to enable the built-in player.</div>
                </div>
              )}
              
              {/* Custom Playlist Input */}
              <div className={`mt-6 w-full flex items-center gap-3 transition-opacity duration-300 ${spotifyUrl ? 'opacity-30 hover:opacity-100 focus-within:opacity-100' : 'opacity-100'}`}>
                <span className="text-[14px]">{spotifyUrl ? '🔗' : '✨'}</span>
                <input 
                  type="text" 
                  value={spotifyUrl}
                  onChange={(e) => setSpotifyUrl(e.target.value)}
                  placeholder="Paste Spotify playlist link here..."
                  className="w-full bg-transparent border-b border-white/20 text-white text-[12px] pb-1.5 outline-none focus:border-indigo-400 placeholder:text-white/30 transition-colors"
                />
                {/* A clear button so they can easily swap playlists */}
                {spotifyUrl && (
                  <button onClick={() => setSpotifyUrl("")} className="text-[10px] text-white/40 hover:text-red-400 font-bold tracking-wider uppercase">Clear</button>
                )}
              </div>

            </div>

          </div>
        </div>
      )}

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