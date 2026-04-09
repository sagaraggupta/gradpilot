import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase'; 
import { generateFCMToken } from '../lib/firebase';

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  // Form Data
  const [name, setName] = useState('');
  const [focusGoal, setFocusGoal] = useState(120); 
  const [budget, setBudget] = useState(7000); 
  const [fcmToken, setFcmToken] = useState(null);
  
  // UI States
  const [loading, setLoading] = useState(false);
  const [isRequestingPush, setIsRequestingPush] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    document.title = "Welcome | GradPilot";
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) navigate('/login'); 
      else {
        setUser(user);
        if (user.user_metadata?.full_name) setName(user.user_metadata.full_name);
      }
    };
    getUser();
  }, [navigate]);

  const nextStep = () => {
    setError('');
    // 🛡️ STRICT VALIDATION (Bug 4 Fixed)
    if (step === 1 && !name.trim()) return setError("Please enter your name, Pilot.");
    if (step === 2) {
      if (focusGoal < 10 || focusGoal > 720) return setError("Focus goal must be between 10 and 720 mins.");
      if (budget < 0 || budget > 999999) return setError("Please enter a valid monthly budget.");
    }
    setStep(prev => prev + 1);
  };

  // 🚀 NEW: Safely handle the Step 4 Boot Sequence
  useEffect(() => {
    if (step === 4) {
      const timer = setTimeout(() => {
        handleSaveProfile();
      }, 1500);
      return () => clearTimeout(timer); // Cleanup if they somehow navigate away
    }
  }, [step]);

  const handleEnablePush = async () => {
    setIsRequestingPush(true);
    const token = await generateFCMToken();
    if (token) setFcmToken(token);
    setIsRequestingPush(false);
    nextStep(); // Auto-advance on success
  };

  const handleSaveProfile = async () => {
    if (!user?.id) return; // 🛡️ CRITICAL NULL CHECK (Bug 1 Fixed)
    setLoading(true);

    try {
      const { error: dbError } = await supabase
        .from('profiles')
        .upsert({ 
          id: user.id, 
          full_name: name,
          daily_focus_goal: focusGoal, 
          monthly_budget: budget,
          push_subscription: fcmToken
        });

      if (dbError) throw dbError;

      // 🎯 THE HOOK MOMENT: Give them a free starter quest!
      await supabase.from('daily_quests').insert([{
        user_id: user.id,
        title: "Complete your setup sequence",
        credits_reward: 100, // 🪙 FIXED: Now issuing Credits instead of XP!
        is_completed: true,
        assigned_date: new Date().toISOString().split('T')[0]
      }]);

      navigate('/dashboard'); 
    } catch (err) {
      console.error('Error saving profile:', err);
      setError('Failed to initialize profile. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0d14] flex flex-col justify-center items-center p-4">
      
      {/* ─── PROGRESS BAR ─── */}
      <div className="w-full max-w-md mb-8 flex gap-2">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${step >= i ? 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'bg-white/10'}`} />
        ))}
      </div>

      <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-3xl p-8 shadow-2xl backdrop-blur-sm relative overflow-hidden">
        
        {error && (
          <div className="absolute top-0 left-0 right-0 bg-red-500 text-white text-[11px] font-bold text-center py-1.5 animate-[slideDown_0.2s_ease-out]">
            {error}
          </div>
        )}

        {/* ─── STEP 1: IDENTITY ─── */}
        {step === 1 && (
          <div className="animate-[fadeIn_0.4s_ease-out]">
            <div className="text-5xl mb-4 text-center animate-bounce">👋</div>
            <h2 className="text-2xl font-extrabold text-white mb-2 text-center">Welcome to GradPilot</h2>
            <p className="text-center text-[13px] text-white/50 mb-8 leading-relaxed">Your personal academic command center. What should we call you?</p>

            <div>
              <label className="block text-[11px] font-bold text-indigo-400 uppercase tracking-widest mb-2">Pilot Callsign</label>
              <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                onKeyDown={(e) => e.key === 'Enter' && nextStep()}
                className="w-full bg-[#0d0d14] border border-white/10 rounded-xl px-4 py-4 text-slate-200 text-[15px] font-bold outline-none focus:border-indigo-500/50 transition-all text-center placeholder:text-white/20 placeholder:font-normal" 
                placeholder="Enter your full name" 
                autoFocus
              />
            </div>
            
            <button onClick={nextStep} className="w-full mt-6 bg-white text-black font-extrabold text-[14px] py-3.5 rounded-xl hover:bg-slate-200 transition-colors shadow-lg">
              Continue
            </button>
          </div>
        )}

        {/* ─── STEP 2: OPERATIONS ─── */}
        {step === 2 && (
          <div className="animate-[fadeIn_0.4s_ease-out]">
            <h2 className="text-2xl font-extrabold text-white mb-2">Set Your Baselines</h2>
            <p className="text-[13px] text-white/50 mb-6 leading-relaxed">Don't worry, you can always change these later in your settings.</p>

            <div className="flex flex-col gap-6">
              <div>
                <label className="flex justify-between items-end mb-2">
                  <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-widest">Daily Focus Target</span>
                  <span className="text-[13px] font-bold text-slate-200">{focusGoal} mins</span>
                </label>
                <input 
                  type="range" min="10" max="480" step="10" 
                  value={focusGoal} onChange={(e) => setFocusGoal(Number(e.target.value))} 
                  className="w-full accent-indigo-500 bg-white/10 rounded-lg appearance-none h-2 cursor-pointer"
                />
                <p className="text-[10px] text-white/30 mt-2 text-right">Recommended: 120 mins</p>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-indigo-400 uppercase tracking-widest mb-2">Monthly Budget Limit (₹)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 font-bold">₹</span>
                  <input 
                    type="number" 
                    value={budget} 
                    onChange={(e) => setBudget(Number(e.target.value))} 
                    onKeyDown={(e) => e.key === 'Enter' && nextStep()}
                    className="w-full bg-[#0d0d14] border border-white/10 rounded-xl pl-8 pr-4 py-3.5 text-slate-200 text-[15px] font-bold outline-none focus:border-indigo-500/50 transition-all" 
                  />
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 mt-8">
              <button onClick={() => setStep(1)} className="px-5 py-3.5 bg-white/5 text-white/60 font-bold rounded-xl hover:bg-white/10 transition-colors">Back</button>
              <button onClick={nextStep} className="flex-1 bg-white text-black font-extrabold text-[14px] py-3.5 rounded-xl hover:bg-slate-200 transition-colors shadow-lg">
                Continue
              </button>
            </div>
          </div>
        )}

        {/* ─── STEP 3: ASSISTANT PERMISSIONS ─── */}
        {step === 3 && (
          <div className="animate-[fadeIn_0.4s_ease-out]">
            <div className="w-16 h-16 bg-indigo-500/20 border-2 border-indigo-500/50 rounded-2xl flex items-center justify-center text-3xl mb-4 text-indigo-400">🔔</div>
            <h2 className="text-2xl font-extrabold text-white mb-2">Enable Smart Assistant</h2>
            <p className="text-[13px] text-white/50 mb-6 leading-relaxed">
              GradPilot works best when it can tap you on the shoulder. Get morning briefings and alerts when your streak is at risk.
            </p>

            <div className="flex flex-col gap-3 mt-8">
              <button 
                onClick={handleEnablePush} 
                disabled={isRequestingPush}
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-extrabold text-[14px] py-4 rounded-xl hover:scale-[1.02] transition-all shadow-[0_0_20px_rgba(99,102,241,0.4)] flex justify-center items-center gap-2"
              >
                {isRequestingPush ? <span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" /> : 'Allow Notifications'}
              </button>
              
              <button 
                onClick={nextStep} 
                className="w-full px-4 py-3 bg-transparent text-white/40 font-bold text-[12px] rounded-xl hover:text-white/80 transition-colors"
              >
                Skip for now
              </button>
            </div>
          </div>
        )}

        {/* ─── STEP 4: THE HOOK / BOOT SEQUENCE ─── */}
        {step === 4 && (
          <div className="text-center animate-[fadeIn_0.4s_ease-out] py-4">
            <div className="relative w-20 h-20 mx-auto mb-6">
              <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center text-2xl">🚀</div>
            </div>
            
            <h2 className="text-xl font-extrabold text-slate-100 mb-2">Booting Command Center</h2>
            <p className="text-[13px] text-indigo-300/70 font-medium">Encrypting profile data...</p>
          </div>
        )}

      </div>
    </div>
  );
}