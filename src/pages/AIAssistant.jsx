import React, { useState, useEffect, useRef, useMemo } from "react";
import { Icon, Icons } from "../components/ui/Icon";
import Modal from "../components/ui/Modal";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { GoogleGenerativeAI } from "@google/generative-ai";

const PERSONAS = {
  standard: { id: "standard", name: "GradPilot Base", icon: "🤖", cost: 0, desc: "Helpful and polite." },
  eli5: { id: "eli5", name: "Explain Like I'm 5", icon: "🧸", cost: 100, desc: "Simplifies complex topics." },
  socratic: { id: "socratic", name: "Socratic Tutor", icon: "🦉", cost: 150, desc: "Asks questions to make you think." },
  strict: { id: "strict", name: "Strict Professor", icon: "🧐", cost: 200, desc: "Tough love and high standards." }
};

const SMART_ACTIONS = [
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
  const [profile, setProfile] = useState(null); // 🐛 FIX: Added Profile State

  // Chat State
  const [messages, setMessages] = useState([
    { role: "ai", text: "Welcome to the AI Study Assistant. I'm connected to your academic database. How can I help you dominate your classes today?" }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // Syllabus Parser State
  const [isParserOpen, setIsParserOpen] = useState(false);
  const [syllabusText, setSyllabusText] = useState("");
  const [isParsing, setIsParsing] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];
  const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || "dummy_key");

  // ─── FETCH ALL DATA ───
  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      const [ { data: tData }, { data: hData }, { data: gData }, { data: sData }, { data: sessionData }, { data: pData } ] = await Promise.all([
        supabase.from('tasks').select('*'),
        supabase.from('habits').select('*'),
        supabase.from('goals').select('*'),
        supabase.from('user_settings').select('*').eq('user_id', user.id).single(),
        supabase.from('study_sessions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10),
        supabase.from('profiles').select('total_xp').eq('id', user.id).single() // 🐛 FIX: Fetch total_xp from profiles
      ]);
      
      if (tData) setTasks(tData);
      if (hData) setHabits(hData);
      if (gData) setGoals(gData);
      if (sData) setUserSettings(sData);
      if (sessionData) setStudySessions(sessionData);
      if (pData) setProfile(pData); // 🐛 FIX: Set profile data
      
      setLoading(false);
    };
    fetchAll();
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // ─── XP MATH ───
  const { currentBalance, activePersona, unlockedPersonas } = useMemo(() => {
    // 🐛 FIX: Start 'earned' with the Focus Timer XP from the Profile!
    let earned = profile?.total_xp || 0; 
    
    habits.forEach(h => earned += (h.streak * 50));
    goals.forEach(g => { earned += (g.progress === 100 ? 500 : g.progress * 5); });
    
    const spent = userSettings?.xp_spent || 0;
    
    return {
      currentBalance: earned - spent,
      activePersona: userSettings?.active_persona || 'standard',
      unlockedPersonas: userSettings?.unlocked_personas || ['standard']
    };
  }, [habits, goals, userSettings, profile]); // 🐛 FIX: Added profile to dependency array

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
      const prompt = `
        You are an advanced academic data extractor. Read the following syllabus text and extract all assignments, essays, exams, and readings. 
        Format the output strictly as a JSON array of objects. Do NOT wrap it in markdown block quotes. Just the raw JSON array.
        Each object must have exactly these keys:
        - "title": (string) The name of the assignment
        - "subject": (string) Try to infer the subject/class name, otherwise use "General"
        - "due": (string) Due date formatted strictly as "YYYY-MM-DD"
        - "priority": (string) Either "low", "medium", or "high" (Exams should be high)
        
        Text to parse:
        ${syllabusText}
      `;

      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      const result = await fallbackModel(prompt, model);
      
      const cleanJsonStr = result.replace(/```json/g, "").replace(/```/g, "").trim();
      const extractedTasks = JSON.parse(cleanJsonStr);

      const tasksToInsert = extractedTasks.map(t => ({
        user_id: user.id,
        title: t.title,
        subject: t.subject,
        due: t.due,
        priority: t.priority,
        status: "pending",
        progress: 0
      }));

      await supabase.from('tasks').insert(tasksToInsert);
      setTasks(prev => [...tasksToInsert, ...prev]);

      setIsParserOpen(false);
      setSyllabusText("");
      setMessages(prev => [...prev, { role: "ai", text: `✨ **Syllabus Parsed!** I successfully extracted ${extractedTasks.length} assignments and added them to your Kanban board. Go check your Assignments tab!` }]);

    } catch (error) {
      console.error(error);
      alert("Failed to parse syllabus. Ensure the text contains clear assignment dates.");
    } finally {
      setIsParsing(false);
    }
  };

  // ─── DUAL ENGINE WRAPPER ───
  const fallbackModel = async (promptText, geminiModel) => {
    try {
      const result = await geminiModel.generateContent(promptText);
      return result.response.text();
    } catch (err) {
      console.warn("Gemini failed, trying Groq Llama 3.1...");
      const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "llama-3.1-8b-instant", messages: [{ role: "user", content: promptText }], max_tokens: 800 })
      });
      if (!groqResponse.ok) throw new Error("Groq also failed");
      const groqData = await groqResponse.json();
      return groqData.choices[0].message.content;
    }
  };

  // ─── MAIN CHAT HANDLER ───
  const handleSendMessage = async (e, forcedText = null, actionCost = 0) => {
    if (e) e.preventDefault();
    const textToSend = forcedText || input;

    if (textToSend === "modal:parse") {
      if (currentBalance < actionCost) return alert("Not enough XP!");
      await deductXP(actionCost);
      setIsParserOpen(true);
      return;
    }

    if (!textToSend.trim()) return;

    if (actionCost > 0) {
      if (currentBalance < actionCost) {
        setMessages(prev => [...prev, { role: "ai", text: "Error: Insufficient XP for this Smart Action." }]);
        return;
      }
      await deductXP(actionCost);
    }

    setMessages(prev => [...prev, { role: "user", text: textToSend }]);
    setInput("");
    setIsTyping(true);

    try {
      let finalPrompt = "";
      const pendingTasks = tasks.filter(t => t.status !== "completed");
      const missedHabits = habits.filter(h => h.last_completed !== todayStr);

      if (textToSend === "/coach") {
        const recentMoods = studySessions.map(s => `${s.subject}: ${s.duration_minutes}m (${s.mood})`).join(", ");
        finalPrompt = `You are an elite academic coach. Analyze the user's data:
          Pending Tasks: ${pendingTasks.length}
          Missed Habits Today: ${missedHabits.map(h => h.name).join(', ') || "None"}
          Recent Study Sessions: ${recentMoods || "No recent sessions logged."}
          
          Provide a highly personalized, empathetic 3-step action plan based on their recent moods and workload. Under 100 words.`;
      } 
      else if (textToSend === "/studyplan") {
        finalPrompt = `You are a strict academic advisor. Student has these pending assignments: ${JSON.stringify(pendingTasks.map(t => t.title + " due " + t.due))}. Generate a short, bulleted 1-day study plan. Under 100 words.`;
      } 
      else if (textToSend === "/roast") {
        finalPrompt = `You are a savage AI. Roast the student. They have ${pendingTasks.length} pending assignments and missed these habits today: ${JSON.stringify(missedHabits.map(h => h.name))}. Keep it funny and brutal. Under 80 words.`;
      } 
      else {
        let personaContext = "You are a helpful AI study assistant.";
        if (activePersona === 'eli5') personaContext = "Explain everything simply like I'm 5 years old.";
        if (activePersona === 'socratic') personaContext = "Ask guiding questions to help me arrive at the answer myself. Don't give direct answers.";
        if (activePersona === 'strict') personaContext = "Be a strict, demanding university professor. Keep answers brief and condescending.";

        finalPrompt = `${personaContext}\n\nUser: ${textToSend}`;
      }

      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      const aiResponseText = await fallbackModel(finalPrompt, model);

      setMessages(prev => [...prev, { role: "ai", text: aiResponseText }]);

    } catch (error) {
      setMessages(prev => [...prev, { role: "ai", text: "⚠️ Both Gemini and Groq API clusters are currently offline. Running in simulation mode." }]);
    } finally {
      setIsTyping(false);
    }
  };

  if (loading) return <div className="flex h-[80vh] items-center justify-center text-white/40">Initializing AI Core...</div>;

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
        <div className="bg-[#0d0d14] border border-white/10 px-4 py-2 rounded-xl flex items-center gap-2 shadow-inner">
          <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Wallet</span>
          <span className="text-[14px] font-extrabold text-amber-400">{currentBalance.toLocaleString()} XP</span>
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
            <div className="text-center text-[10px] text-white/30 mt-2">Smart Actions cost XP.</div>
          </form>
        </div>

        {/* ─── SIDEBAR: AI STORE & COMMANDS ─── */}
        <div className="w-full lg:w-80 flex flex-col gap-4 shrink-0 overflow-y-auto pr-1">
          
          {/* SMART ACTIONS */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-5">
            <h3 className="text-slate-100 font-semibold text-[14px] mb-4 flex items-center gap-2">
              <span className="text-indigo-400">⚡</span> Premium Actions
            </h3>
            <div className="flex flex-col gap-3">
              {SMART_ACTIONS.map(action => {
                const canAfford = currentBalance >= action.cost;
                return (
                  <button 
                    key={action.id} onClick={() => handleSendMessage(null, action.command, action.cost)}
                    disabled={isTyping || !canAfford}
                    className="flex items-center justify-between p-3 rounded-xl bg-[#0d0d14] border border-white/5 hover:border-indigo-500/30 transition-all text-left group disabled:opacity-50 disabled:hover:border-white/5"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{action.icon}</span>
                      <span className={`text-[12px] font-bold text-slate-200 transition-colors ${action.id === 'parse' ? 'group-hover:text-green-400' : 'group-hover:text-indigo-300'}`}>{action.name}</span>
                    </div>
                    <div className="text-[10px] font-bold text-amber-400 bg-amber-400/10 px-2 py-1 rounded-md">-{action.cost} XP</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* PERSONA SHOP */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-5 flex-1">
            <h3 className="text-slate-100 font-semibold text-[14px] mb-1 flex items-center gap-2">
              <span className="text-purple-400">🎭</span> AI Personas
            </h3>
            <p className="text-[11px] text-white/40 mb-4">Unlock different teaching styles.</p>
            
            <div className="flex flex-col gap-3">
              {Object.entries(PERSONAS).map(([id, p]) => {
                const isUnlocked = unlockedPersonas.includes(id);
                const isActive = activePersona === id;
                const canAfford = currentBalance >= p.cost;

                return (
                  <div key={id} className={`p-3 rounded-xl border transition-all ${isActive ? 'bg-indigo-500/10 border-indigo-500/50 shadow-md' : 'bg-[#0d0d14] border-white/5'}`}>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl bg-white/5 w-10 h-10 flex items-center justify-center rounded-xl">{p.icon}</span>
                      <div className="min-w-0">
                        <div className="text-[13px] font-bold text-slate-200 truncate">{p.name}</div>
                        <div className="text-[10px] text-white/40 leading-tight pr-1">{p.desc}</div>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => isUnlocked ? equipPersona(id) : unlockPersona(id, p.cost)}
                      disabled={(!isUnlocked && !canAfford) || isActive}
                      className={`w-full py-2 rounded-lg text-[11px] font-bold transition-all ${isActive ? 'bg-indigo-500/20 text-indigo-300 cursor-default' : isUnlocked ? 'bg-white/10 text-white hover:bg-white/20' : canAfford ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30' : 'bg-white/5 text-white/20 cursor-not-allowed'}`}
                    >
                      {isActive ? 'Active' : isUnlocked ? 'Equip Persona' : `Unlock (${p.cost} XP)`}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ─── THE NEW SYLLABUS PARSER MODAL ─── */}
      <Modal isOpen={isParserOpen} onClose={() => setIsParserOpen(false)} title="Syllabus Auto-Parser">
        <form onSubmit={handleParseSyllabus} className="flex flex-col gap-4">
          <div>
            <p className="text-[13px] text-white/60 mb-4 leading-relaxed">
              Paste the text from your course syllabus below. Gemini will scan it, extract all assignment names and due dates, and magically add them to your Kanban board!
            </p>
            <textarea 
              value={syllabusText} 
              onChange={(e) => setSyllabusText(e.target.value)}
              placeholder="Paste syllabus text here (e.g., 'Midterm Exam is on Oct 14th. Final Essay due Nov 2nd...')"
              className="w-full h-48 bg-[#0d0d14] border border-white/10 rounded-xl p-4 text-slate-200 text-[13px] outline-none focus:border-indigo-500/50 resize-none transition-colors leading-relaxed"
            />
          </div>
          <button 
            type="submit" 
            disabled={isParsing || !syllabusText.trim()}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-br from-green-500 to-emerald-600 text-white font-bold text-[13px] py-3.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 shadow-lg shadow-green-500/20"
          >
            {isParsing ? (
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Analyzing Syllabus...</>
            ) : (
              <>✨ Extract & Add Tasks</>
            )}
          </button>
        </form>
      </Modal>

    </div>
  );
}