import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function Auth() {
  const [email, setEmail] = useState('');
  
  // UI States
  const [globalError, setGlobalError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "User Login | GradPilot";
  }, []);

  // Smart Redirect: Check if they are actually onboarded first!
  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        // Ask the database if they have a name yet
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', data.session.user.id)
          .maybeSingle();

        if (profile && profile.full_name) {
          navigate('/dashboard'); // Old user -> Dashboard
        } else {
          navigate('/onboarding'); // New user -> Onboarding!
        }
      }
    };
    checkUser();
  }, [navigate]);

  const handleMagicLink = async (e) => {
    e.preventDefault();
    setLoading(true);
    setGlobalError(null);
    setFieldErrors({});

    if (!email.trim()) {
      setFieldErrors({ email: "Email address is required." });
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        // Send them to /dashboard so ProtectedRoute catches them!
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    });

    if (error) {
      setGlobalError(error.message);
    } else {
      setSuccess(true); 
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {redirectTo: `${window.location.origin}/dashboard`,}
    });
    if (error) {
      setGlobalError(error.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0d14] flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-3xl p-8 shadow-2xl backdrop-blur-sm animate-[fadeIn_0.3s_ease-out]">
        
        {/* LOGO & BRANDING */}
        <div className="flex flex-col items-center gap-3 mb-6 justify-center">
          <img 
            src="/GradPilot.png" 
            alt="GradPilot Logo" 
            className="h-12 w-auto object-contain drop-shadow-[0_0_15px_rgba(99,102,241,0.4)]" 
          />
        </div>

        {/* UNIFIED HEADING */}
        <h2 className="text-xl font-bold text-white mb-2 text-center">Get started with GradPilot</h2>
        <p className="text-center text-[13px] text-white/40 mb-8">Log in or create a new account to continue.</p>

        {/* GLOBAL ERROR */}
        {globalError && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-[13px] font-medium p-3.5 rounded-xl mb-6 flex items-center gap-2">
            <span className="text-lg shrink-0">⚠️</span> {globalError}
          </div>
        )}

        {/* SUCCESS MESSAGE */}
        {success ? (
          <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-2xl p-8 text-center animate-[fadeIn_0.5s_ease-out]">
            <div className="w-16 h-16 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-5 text-indigo-400 text-3xl">
              ✉️
            </div>
            <h3 className="text-indigo-400 font-bold text-xl mb-2">Check your email!</h3>
            <p className="text-indigo-400/80 text-[14px] leading-relaxed mb-2">
              We sent a magic link to <strong>{email}</strong>.
            </p>
            <p className="text-indigo-400/60 text-[12px] leading-relaxed">
              Click the link to instantly log in or create your account.
            </p>
          </div>
        ) : (
          <form onSubmit={handleMagicLink} className="flex flex-col gap-4">
            
            {/* GOOGLE BUTTON */}
            <button 
              type="button" 
              onClick={handleGoogleLogin}
              className="w-full bg-[#0d0d14] border border-white/10 text-white font-bold text-[13px] py-3.5 rounded-xl hover:bg-white/5 transition-colors flex items-center justify-center gap-3 shadow-sm"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>

            {/* DIVIDER */}
            <div className="flex items-center my-2">
              <div className="flex-grow border-t border-white/10"></div>
              <span className="px-3 text-[10px] font-bold text-white/30 uppercase tracking-widest">or</span>
              <div className="flex-grow border-t border-white/10"></div>
            </div>

            {/* EMAIL INPUT */}
            <div>
              <label className="block text-[11px] font-bold text-white/40 uppercase tracking-widest mb-1.5">Email Address</label>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => { setEmail(e.target.value); setFieldErrors({...fieldErrors, email: null}); setGlobalError(null); }} 
                className={`w-full bg-[#0d0d14] border rounded-xl px-4 py-3.5 text-slate-200 text-[13px] outline-none transition-colors 
                  ${fieldErrors.email ? 'border-red-500/50 focus:border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.1)]' : 'border-white/10 focus:border-indigo-500/50'}
                `} 
                placeholder="you@gmail.com" 
              />
              {fieldErrors.email && <span className="text-[11px] text-red-400 font-medium mt-1.5 block">{fieldErrors.email}</span>}
            </div>

            <button 
              type="submit" 
              disabled={loading} 
              className="w-full mt-2 bg-gradient-to-br from-indigo-500 to-purple-500 text-white font-bold text-[14px] py-3.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 shadow-lg shadow-indigo-500/20"
            >
              {loading ? 'Sending link...' : 'Continue with Email'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}