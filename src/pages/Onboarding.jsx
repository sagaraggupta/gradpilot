import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase'; 
import { generateFCMToken } from '../lib/firebase';

export default function Onboarding() {
  const [name, setName] = useState('');
  const [focusGoal, setFocusGoal] = useState(120); 
  const [budget, setBudget] = useState(7000); // 🚀 NEW: Budget state defaulting to 7000
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const [fcmToken, setFcmToken] = useState(null);
  const [isRequestingPush, setIsRequestingPush] = useState(false);

  const handleEnablePush = async () => {
    setIsRequestingPush(true);
    const token = await generateFCMToken();
    if (token) setFcmToken(token);
    setIsRequestingPush(false);
  };

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/login'); 
      } else {
        setUser(user);
        
        if (user.user_metadata?.full_name) {
          setName(user.user_metadata.full_name);
        }
      }
    };
    getUser();
  }, [navigate]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);

    const { error } = await supabase
      .from('profiles')
      .upsert({ 
        id: user.id, 
        full_name: name,
        daily_focus_goal: focusGoal, 
        monthly_budget: budget,
        push_subscription: fcmToken
      });

    if (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile. Please try again.');
    } else {
      navigate('/dashboard'); 
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0d0d14] flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-3xl p-8 shadow-2xl backdrop-blur-sm animate-[fadeIn_0.3s_ease-out]">
        
        <div className="text-4xl mb-4 text-center">👋</div>
        <h2 className="text-2xl font-bold text-white mb-2 text-center">Welcome to GradPilot!</h2>
        <p className="text-center text-[13px] text-white/40 mb-8">Let's set up your profile to get started.</p>

        <form onSubmit={handleSaveProfile} className="flex flex-col gap-5">
          
          {/* NAME INPUT */}
          <div>
            <label className="block text-[11px] font-bold text-white/40 uppercase tracking-widest mb-1.5">
              What should we call you?
            </label>
            <input 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              className="w-full bg-[#0d0d14] border border-white/10 rounded-xl px-4 py-3.5 text-slate-200 text-[13px] outline-none focus:border-indigo-500/50 transition-colors" 
              placeholder="e.g. Sagar Gupta" 
              required
            />
          </div>

          {/* DAILY FOCUS GOAL INPUT */}
          <div>
            <label className="block text-[11px] font-bold text-white/40 uppercase tracking-widest mb-1.5">
              Daily Focus Goal (Minutes)
            </label>
            <input 
              type="number" 
              value={focusGoal} 
              onChange={(e) => setFocusGoal(Number(e.target.value))} 
              className="w-full bg-[#0d0d14] border border-white/10 rounded-xl px-4 py-3.5 text-slate-200 text-[13px] outline-none focus:border-indigo-500/50 transition-colors" 
              min="10"
              max="720"
              required
            />
          </div>

          {/* 🚀 NEW: MONTHLY BUDGET INPUT */}
          <div>
            <label className="block text-[11px] font-bold text-white/40 uppercase tracking-widest mb-1.5">
              Monthly Budget target
            </label>
            <input 
              type="number" 
              value={budget} 
              onChange={(e) => setBudget(Number(e.target.value))} 
              className="w-full bg-[#0d0d14] border border-white/10 rounded-xl px-4 py-3.5 text-slate-200 text-[13px] outline-none focus:border-indigo-500/50 transition-colors" 
              min="0"
              required
            />
          </div>

          {/* 🚀 NEW: SOFT PROMPT FOR NOTIFICATIONS */}
          <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-xl p-4 mt-2">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🔔</span>
              <div className="flex-1">
                <h3 className="text-[13px] font-bold text-indigo-300">Smart Assistant</h3>
                <p className="text-[11px] text-white/50 mt-1 leading-relaxed">
                  Get morning briefings on your assignments and evening reminders to keep your streaks alive!
                </p>
                
                {fcmToken ? (
                  <div className="mt-3 text-[12px] font-bold text-green-400 flex items-center gap-1">
                    ✅ Notifications Enabled
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleEnablePush}
                    disabled={isRequestingPush}
                    className="mt-3 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-[11px] font-bold rounded-lg transition-colors disabled:opacity-50"
                  >
                    {isRequestingPush ? 'Connecting...' : 'Allow Notifications'}
                  </button>
                )}
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading || !name} 
            className="w-full mt-4 bg-gradient-to-br from-indigo-500 to-purple-500 text-white font-bold text-[14px] py-3.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 shadow-lg shadow-indigo-500/20"
          >
            {loading ? 'Saving Profile...' : 'Go to Dashboard 🚀'}
          </button>
        </form>
      </div>
    </div>
  );
}