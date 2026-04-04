import React, { useState, useEffect, useRef, useMemo } from "react";
import { Icon, Icons } from "../components/ui/Icon";
import Modal from "../components/ui/Modal";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import AISidebar from "../components/ai/AISidebar";
import SyllabusParserModal from "../components/ai/SyllabusParserModal";

const PERSONAS = {
  standard: { id: "standard", name: "GradPilot Base", icon: "🤖", cost: 0, desc: "Helpful and polite." },
  eli5: { id: "eli5", name: "Explain Like I'm 5", icon: "🧸", cost: 100, desc: "Simplifies complex topics." },
  socratic: { id: "socratic", name: "Socratic Tutor", icon: "🦉", cost: 150, desc: "Asks questions to make you think." },
  strict: { id: "strict", name: "Strict Professor", icon: "🧐", cost: 200, desc: "Tough love and high standards." }
};

const SMART_ACTIONS = [
  { id: "audit", name: "Audit My Finances", command: "/audit", cost: 25, icon: "💸" },
  { id: "coach", name: "Analyze Performance", command: "/coach", cost: 25, icon: "🧠" },
  { id: "studyplan", name: "Generate Study Plan", command: "/studyplan", cost: 20, icon: "📅" },
  { id: "roast", name: "Roast My Productivity", command: "/roast", cost: 15, icon: "🔥" },
  { id: "parse", name: "Parse Syllabus (Auto-Add)", command: "modal:parse", cost: 50, icon: "📄" }
];

export default function AIAssistant() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  
  // Data State
  const [tasks, setTasks] = useState([]);
  const [habits, setHabits] = useState([]);
  const [goals, setGoals] = useState([]);
  const [userSettings, setUserSettings] = useState(null);
  const [studySessions, setStudySessions] = useState([]); 
  const [profile, setProfile] = useState(null);
  const [expenses, setExpenses] = useState([]);

  useEffect(() => {
      document.title = "Ai Assitant | GradPilot";
    }, []);

  // ─── AI MEMORY (Database State) ───
  const [messages, setMessages] = useState([]);

  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // Syllabus Parser State
  const [isParserOpen, setIsParserOpen] = useState(false);
  const [syllabusText, setSyllabusText] = useState("");
  const [isParsing, setIsParsing] = useState(false);

  // Calculate reliable local date to avoid timezone shift bugs at midnight
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const todayStr = `${year}-${month}-${day}`;

  // ─── FETCH ALL DATA ───
  useEffect(() => {
    const fetchAll = async () => {
      if (!user?.id) return; // 🐛 Bug 1 Fix: Strict safety guard
      setLoading(true);
      
      const [ tRes, hRes, gRes, sRes, sessionRes, pRes, eRes, chatRes ] = await Promise.all([
        supabase.from('tasks').select('*').eq('user_id', user.id),
        supabase.from('habits').select('*').eq('user_id', user.id),
        supabase.from('goals').select('*').eq('user_id', user.id),
        supabase.from('user_settings').select('*').eq('user_id', user.id).single(),
        supabase.from('study_sessions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10),
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('expenses').select('*').eq('user_id', user.id),
        supabase.from('chat_history').select('role, text').eq('user_id', user.id).order('created_at', { ascending: true }) // 🚀 NEW!
      ]);
      
      [tRes, hRes, gRes, sRes, sessionRes, pRes, eRes, chatRes].forEach(res => {
        if (res.error && res.error.code !== 'PGRST116') console.error("DB Fetch Error:", res.error.message);
      });

      if (tRes.data) setTasks(tRes.data);
      if (hRes.data) setHabits(hRes.data);
      if (gRes.data) setGoals(gRes.data);
      if (sRes.data) setUserSettings(sRes.data);
      if (sessionRes.data) setStudySessions(sessionRes.data);
      if (pRes.data) setProfile(pRes.data); 
      if (eRes.data) setExpenses(eRes.data);
      
      // Load history, or set a default greeting if it's their first time
      if (chatRes.data && chatRes.data.length > 0) {
        setMessages(chatRes.data);
      } else {
        setMessages([{ role: "ai", text: "Welcome to the AI Study Assistant. I'm connected to your academic database. How can I help you dominate your classes today?" }]);
      }
      
      setLoading(false);
    };
    fetchAll();
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // ─── XP MATH ───
  const { currentBalance, activePersona, unlockedPersonas } = useMemo(() => {
    // 🐛 Bug 3 Fix: Loading fallback to prevent temporary wrong XP
    if (!profile) return { currentBalance: 0, activePersona: 'standard', unlockedPersonas: ['standard'] };

    let earned = profile.total_xp || 0; 
    
    habits.forEach(h => earned += (h.streak * 50));
    goals.forEach(g => { earned += (g.progress === 100 ? 500 : g.progress * 5); });
    
    const spent = userSettings?.xp_spent || 0;
    
    return {
      currentBalance: earned - spent,
      activePersona: userSettings?.active_persona || 'standard',
      unlockedPersonas: userSettings?.unlocked_personas || ['standard']
    };
  }, [habits, goals, userSettings, profile]); 

  const deductXP = async (amount) => {
    const newSpent = (userSettings?.xp_spent || 0) + amount;
    setUserSettings(prev => ({ ...prev, xp_spent: newSpent }));
    await supabase.from('user_settings').update({ xp_spent: newSpent }).eq('user_id', user.id);
  };

  const unlockPersona = async (personaId, cost) => {
    if (currentBalance < cost) return alert("Not enough XP!");
    const newUnlocked = [...unlockedPersonas, personaId];
    const newSpent = (userSettings?.xp_spent || 0) + cost;
    setUserSettings(prev => ({ ...prev, xp_spent: newSpent, unlocked_personas: newUnlocked, active_persona: personaId }));
    await supabase.from('user_settings').update({ xp_spent: newSpent, unlocked_personas: newUnlocked, active_persona: personaId }).eq('user_id', user.id);
    setMessages(prev => [...prev, { role: "ai", text: `*SYSTEM: Persona Unlocked! I am now operating as ${PERSONAS[personaId].name}.*` }]);
  };

  const equipPersona = async (personaId) => {
    setUserSettings(prev => ({ ...prev, active_persona: personaId }));
    await supabase.from('user_settings').update({ active_persona: personaId }).eq('user_id', user.id);
    setMessages(prev => [...prev, { role: "ai", text: `*SYSTEM: Switched to ${PERSONAS[personaId].name}.*` }]);
  };

  // ─── THE SYLLABUS PARSER ENGINE ───
  const handleParseSyllabus = async (e) => {
    e.preventDefault();
    if (!syllabusText.trim()) return;
    setIsParsing(true);

    try {
      // Delegate AI processing to secure Edge Functions to prevent exposing API keys on the frontend
      const { data: extractedTasks, error } = await supabase.functions.invoke('parse-syllabus', {
        body: { syllabusText }
      });

      if (error) throw error;
      if (!extractedTasks || !Array.isArray(extractedTasks)) throw new Error("Invalid response format");

      const tasksToInsert = extractedTasks.map(t => ({
        user_id: user.id,
        title: t.title,
        subject: t.subject || "General",
        due: t.due,
        priority: t.priority || "medium",
        status: "pending",
        progress: 0
      }));

      await supabase.from('tasks').insert(tasksToInsert);
      setTasks(prev => [...tasksToInsert, ...prev]);
      
      // Deduct XP only on successful execution
      await deductXP(50);

      setIsParserOpen(false);
      setSyllabusText("");
      setMessages(prev => [...prev, { role: "ai", text: `✨ **Syllabus Parsed!** I successfully extracted ${extractedTasks.length} assignments and added them to your Kanban board. Go check your Assignments tab!` }]);

    } catch (error) {
      console.error(error);
      alert("Failed to parse syllabus. Please try again.");
    } finally {
      setIsParsing(false);
    }
  };

  // ─── CLEAR CHAT HISTORY ───
  const handleClearChat = async () => {
    if (!window.confirm("Are you sure you want to permanently delete your chat history?")) return;

    // 1. Optimistically reset the UI immediately
    setMessages([{ role: "ai", text: "Chat history cleared. How can I help you today?" }]);

    // 2. Wipe it from the Supabase database
    try {
      const { error } = await supabase
        .from('chat_history')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;
    } catch (error) {
      console.error("Failed to clear chat history:", error);
      alert("Failed to clear history on the server. Please try again.");
    }
  };

  // ─── MAIN CHAT HANDLER ───
  const handleSendMessage = async (e, forcedText = null, actionCost = 0) => {
    if (e) e.preventDefault();
    if (isTyping) return; // 🐛 Bug 7 Fix: Rate Limiting / Spam Protection

    const textToSend = forcedText || input;
    if (!textToSend.trim()) return;

    // 🛑 THE LOOPHOLE FIX: Check if they manually typed a premium command!
    const matchedCommand = SMART_ACTIONS.find(a => a.command === textToSend);
    const finalCost = matchedCommand ? matchedCommand.cost : actionCost;

    if (textToSend === "modal:parse") {
      if (currentBalance < finalCost) return alert("Not enough XP!");
      setIsParserOpen(true);
      return;
    }

    if (finalCost > 0) {
      if (currentBalance < finalCost) {
        setMessages(prev => [...prev, { role: "ai", text: "Error: Insufficient XP for this Smart Action." }]);
        return;
      }
      await deductXP(finalCost);
    }

    // Update UI and save User message to Database
    const newUserMsg = { role: "user", text: textToSend };
    setMessages(prev => [...prev, newUserMsg]);
    supabase.from('chat_history').insert([{ user_id: user.id, ...newUserMsg }]).then();
    setInput("");
    setIsTyping(true);

    try {
      let finalPrompt = "";
      const pendingTasks = tasks.filter(t => t.status !== "completed");
      const missedHabits = habits.filter(h => h.last_completed !== todayStr);

      if (textToSend === "/coach") {
        const recentMoods = studySessions.map(s => `${s.subject}: ${s.duration_minutes}m (${s.mood})`).join(", ");
        finalPrompt = `You are an elite academic coach. Analyze the user's data: Pending Tasks: ${pendingTasks.length}, Missed Habits: ${missedHabits.map(h => h.name).join(', ') || "None"}. Recent Sessions: ${recentMoods || "None"}. Provide a personalized 3-step action plan under 100 words.`;
      } 
      // 🚀 ADVANCED FINANCIAL AUDITOR 🚀
      else if (textToSend === "/audit") {
        const currentMonthExp = expenses.filter(exp => new Date(exp.date).getMonth() === new Date().getMonth());
        const spentThisMonth = currentMonthExp.reduce((acc, exp) => acc + Number(exp.amount), 0);
        const budget = profile?.monthly_budget || 7000;

        // 1. Burn Rate Math
        const todayNum = new Date().getDate();
        const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
        const safeDailyBurn = budget / daysInMonth;
        const actualDailyBurn = spentThisMonth / Math.max(1, todayNum); 
        const projectedSpend = actualDailyBurn * daysInMonth;

        // 2. Category Breakdown (Find the leak)
        const categoryTotals = currentMonthExp.reduce((acc, exp) => {
          acc[exp.category] = (acc[exp.category] || 0) + Number(exp.amount);
          return acc;
        }, {});
        
        // Sort categories to find where they waste the most money
        const topCategory = Object.keys(categoryTotals).sort((a, b) => categoryTotals[b] - categoryTotals[a])[0] || "None";
        const topCategorySpend = categoryTotals[topCategory] || 0;

        finalPrompt = `You are a strict, elite financial auditor. 
        Data: Budget is ₹${budget}. Spent: ₹${spentThisMonth}.
        Pacing: They are burning ₹${Math.round(actualDailyBurn)}/day (Safe limit is ₹${Math.round(safeDailyBurn)}/day).
        Projected month-end spend: ₹${Math.round(projectedSpend)}.
        Top spending category: ${topCategory} (₹${topCategorySpend}).
        
        Write a brutal, data-driven financial audit. If their projected spend exceeds their budget, specifically rip into their ${topCategory} spending. Keep it punchy, insightful, and under 100 words.`;
      }
      else if (textToSend === "/studyplan") {
        // Feed the AI rich data instead of just titles
        const taskDetails = pendingTasks.map(t => `[${t.priority.toUpperCase()}] ${t.title} (Due: ${t.due})`).join(" | ");
        
        finalPrompt = `You are an elite academic advisor. 
        Context: The student needs a study plan. Their pending tasks are: ${taskDetails || "None currently"}.
        Task: Create a highly optimized, realistic 1-day study schedule. 
        Rules: 
        1. Prioritize tasks marked as HIGH or those due soonest.
        2. Use Markdown bullet points grouped by time blocks (e.g., 🌞 Morning, ☕ Afternoon).
        3. Include short breaks.
        4. Keep it highly actionable, encouraging, and strictly under 150 words.`;
      } 
      else if (textToSend === "/roast") {
        finalPrompt = `You are a savage, sarcastic AI productivity coach. 
        Context: The student is slacking. They have ${pendingTasks.length} pending assignments and completely ignored these daily habits today: ${missedHabits.map(h => h.name).join(', ') || "None"}. 
        Task: Roast them ruthlessly for their laziness. Use sharp wit, make fun of their procrastination, and tell them to close YouTube and get to work. 
        Rules: Keep it extremely punchy, brutal, and strictly under 80 words. Zero pleasantries.`;
      } 
      else {
        // Upgraded Personas with behavioral constraints
        let personaContext = "You are GradPilot Base, a highly efficient, concise, and supportive academic assistant.";
        
        if (activePersona === 'eli5') {
          personaContext = "You are a friendly tutor. Rule: Explain complex concepts so simply that a 5-year-old could understand. Use fun analogies and strictly avoid academic jargon.";
        }
        if (activePersona === 'socratic') {
          personaContext = "You are a Socratic tutor. Rule: DO NOT give direct answers. Instead, ask probing, step-by-step questions to guide the student to discover the answer themselves.";
        }
        if (activePersona === 'strict') {
          personaContext = "You are a demanding, no-nonsense university professor. Rule: Your tone is formal, dry, and slightly impatient. Expect excellence, do not coddle the student, and give brutally direct feedback.";
        }

        finalPrompt = `System Context: ${personaContext}
        Formatting Rule: Always use Markdown (bolding, lists) for readability. Keep responses under 150 words unless the user explicitly asks for a long essay.
        
        User Query: ${textToSend}`;
      }

      // 1. Verify the session is alive
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.access_token) {
        alert("Session expired or missing! Please sign out and sign back in.");
        throw new Error("Missing active session.");
      }

      // 2. Call the AI securely
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: { prompt: finalPrompt }, // ✅ FIX: Use finalPrompt
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) throw error;

      // Update UI and save AI message to Database
      const newAiMsg = { role: "ai", text: data.reply };
      setMessages(prev => [...prev, newAiMsg]);
      supabase.from('chat_history').insert([{ user_id: user.id, ...newAiMsg }]).then();

    } catch (error) {
      console.error(error);
      if (finalCost > 0) {
      // 🐛 Bug 5 Fix: Math.max prevents negative spent XP
        const refund = Math.max(0, (userSettings?.xp_spent || 0) - finalCost);
        setUserSettings(prev => ({ ...prev, xp_spent: refund }));
        await supabase.from('user_settings').update({ xp_spent: refund }).eq('user_id', user.id);
      }
      setMessages(prev => [...prev, { role: "ai", text: "⚠️ Secure connection failed. Your XP has been refunded." }]);
    } finally {
      setIsTyping(false);
    }
  };

  // ─── LOADING SKELETON UI ───
  if (loading) return (
    <div className="flex flex-col gap-6 relative h-[calc(100vh-100px)] animate-[pulse_1.5s_ease-in-out_infinite]">
      
      {/* Header Skeleton */}
      <div className="flex justify-between items-center bg-white/5 border border-white/10 p-4 rounded-2xl shrink-0">
        <div className="flex flex-col gap-2">
          <div className="h-6 w-48 bg-white/10 rounded-lg"></div>
          <div className="h-3 w-32 bg-white/5 rounded-lg"></div>
        </div>
        <div className="h-10 w-24 bg-white/10 rounded-xl"></div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
        
        {/* Chat Interface Skeleton */}
        <div className="flex-1 bg-[#0d0d14] border border-white/10 rounded-3xl p-6 flex flex-col gap-6 shadow-2xl relative">
          <div className="flex gap-4 max-w-[85%]">
            <div className="w-10 h-10 rounded-2xl bg-white/10 shrink-0"></div>
            <div className="h-20 w-64 bg-white/5 rounded-2xl rounded-tl-none"></div>
          </div>
          <div className="flex gap-4 max-w-[85%] ml-auto flex-row-reverse">
            <div className="w-10 h-10 rounded-2xl bg-white/10 shrink-0"></div>
            <div className="h-12 w-48 bg-white/10 rounded-2xl rounded-tr-none"></div>
          </div>
          <div className="mt-auto h-14 w-full bg-white/5 border border-white/10 rounded-2xl"></div>
        </div>

        {/* Sidebar Skeleton */}
        <div className="w-full lg:w-80 flex flex-col gap-4 shrink-0">
          <div className="h-[250px] bg-white/5 border border-white/10 rounded-3xl p-5"></div>
          <div className="flex-1 bg-white/5 border border-white/10 rounded-3xl p-5"></div>
        </div>

      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-6 relative h-[calc(100vh-100px)]">
      
      {/* ─── HEADER ─── */}
      <div className="flex justify-between items-center bg-white/5 border border-white/10 p-4 rounded-2xl shrink-0">
        <div>
          <h2 className="text-[20px] font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 font-['Plus_Jakarta_Sans'] tracking-tight">
            AI Study Assistant
          </h2>
          <p className="text-white/40 text-[12px] font-medium">Powered by Gemini & Groq</p>
        </div>
        <div className="flex items-center gap-3">
          
          {/* 🚀 NEW CLEAR CHAT BUTTON */}
          <button 
            onClick={handleClearChat}
            disabled={isTyping || messages.length <= 1}
            className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white/40 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/30 transition-all text-[12px] font-bold disabled:opacity-30"
            title="Delete Chat History"
          >
            🗑️ <span className="hidden lg:inline">Clear Chat</span>
          </button>

          <div className="bg-[#0d0d14] border border-white/10 px-4 py-2 rounded-xl flex items-center gap-2 shadow-inner">
            <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Wallet</span>
            <span className="text-[14px] font-extrabold text-amber-400">{currentBalance.toLocaleString()} XP</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
        
        {/* ─── CHAT INTERFACE ─── */}
        <div className="flex-1 flex flex-col bg-[#0d0d14] border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative">
          
          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-4 max-w-[85%] ${msg.role === "user" ? "ml-auto flex-row-reverse" : ""}`}>
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xl shrink-0 ${msg.role === "user" ? "bg-indigo-500/20 text-indigo-300" : "bg-gradient-to-br from-indigo-500 to-purple-500 shadow-lg text-white"}`}>
                  {msg.role === "user" ? "🧑‍🎓" : PERSONAS[activePersona].icon}
                </div>
                <div className={`p-4 rounded-2xl text-[14px] leading-relaxed whitespace-pre-wrap ${msg.role === "user" ? "bg-indigo-500 text-white rounded-tr-none" : "bg-white/5 border border-white/10 text-slate-200 rounded-tl-none"}`}>
                  {msg.text}
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex gap-4 max-w-[85%]">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-xl shrink-0 shadow-lg">{PERSONAS[activePersona].icon}</div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 rounded-tl-none flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-2 h-2 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-2 h-2 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={(e) => handleSendMessage(e, null, 0)} className="p-4 bg-white/5 border-t border-white/10">
            <div className="relative flex items-center">
              <input 
                type="text" 
                placeholder={`Message ${PERSONAS[activePersona].name}...`}
                value={input} onChange={e => setInput(e.target.value)}
                disabled={isTyping}
                className="w-full bg-[#0d0d14] border border-white/10 rounded-2xl pl-5 pr-14 py-4 text-[14px] text-slate-200 outline-none focus:border-indigo-500/50 transition-colors disabled:opacity-50 shadow-inner"
              />
              <button 
                type="submit" disabled={!input.trim() || isTyping}
                className="absolute right-2 w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center text-white hover:bg-indigo-400 disabled:opacity-50 disabled:hover:bg-indigo-500 transition-colors shadow-md"
              >
                <Icon d="M5 12h14M12 5l7 7-7 7" size={16} /> 
              </button>
            </div>
            <div className="text-center text-[10px] font-bold text-white/30 mt-3 tracking-wide">
              ⚡ Premium commands consume XP.
            </div>
          </form>
        </div>

        {/* ─── MODULARIZED SIDEBAR ─── */}
        <AISidebar 
          currentBalance={currentBalance}
          activePersona={activePersona}
          unlockedPersonas={unlockedPersonas}
          isTyping={isTyping}
          handleSendMessage={handleSendMessage}
          equipPersona={equipPersona}
          unlockPersona={unlockPersona}
          PERSONAS={PERSONAS}
          SMART_ACTIONS={SMART_ACTIONS}
        />
      </div>

      {/* ─── MODULARIZED SYLLABUS PARSER ─── */}
      <SyllabusParserModal 
        isOpen={isParserOpen}
        onClose={() => setIsParserOpen(false)}
        syllabusText={syllabusText}
        setSyllabusText={setSyllabusText}
        handleParseSyllabus={handleParseSyllabus}
        isParsing={isParsing}
      />

    </div>
  );
}