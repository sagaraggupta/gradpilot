<<<<<<< HEAD
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
=======
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // UI States
  const [showPassword, setShowPassword] = useState(false);
  const [globalError, setGlobalError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
>>>>>>> d5c8fd0b23f1e1f126f3ab7cb66827dd5d3393e6
    e.preventDefault();
    setLoading(true);
    setGlobalError(null);
    setFieldErrors({});

<<<<<<< HEAD
    if (!email.trim()) {
      setFieldErrors({ email: "Email address is required." });
=======
    // 1. Inline Field Validation
    const errors = {};
    if (!email.trim()) errors.email = "Email address is required.";
    if (!password) errors.password = "Password is required.";
    
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
>>>>>>> d5c8fd0b23f1e1f126f3ab7cb66827dd5d3393e6
      setLoading(false);
      return;
    }

<<<<<<< HEAD
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        // Send them to /dashboard so ProtectedRoute catches them!
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    });
=======
    // 2. Supabase Authentication
    const { error } = await supabase.auth.signInWithPassword({ email, password });
>>>>>>> d5c8fd0b23f1e1f126f3ab7cb66827dd5d3393e6

    if (error) {
      setGlobalError(error.message);
    } else {
<<<<<<< HEAD
      setSuccess(true); 
=======
      navigate('/'); 
>>>>>>> d5c8fd0b23f1e1f126f3ab7cb66827dd5d3393e6
    }
    setLoading(false);
  };

<<<<<<< HEAD
  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {redirectTo: `${window.location.origin}/dashboard`,}
    });
    if (error) {
      setGlobalError(error.message);
    }
  };

=======
>>>>>>> d5c8fd0b23f1e1f126f3ab7cb66827dd5d3393e6
  return (
    <div className="min-h-screen bg-[#0d0d14] flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-3xl p-8 shadow-2xl backdrop-blur-sm animate-[fadeIn_0.3s_ease-out]">
        
        {/* LOGO & BRANDING */}
<<<<<<< HEAD
        <div className="flex flex-col items-center gap-3 mb-6 justify-center">
=======
        <div className="flex flex-col items-center gap-3 mb-8 justify-center">
>>>>>>> d5c8fd0b23f1e1f126f3ab7cb66827dd5d3393e6
          <img 
            src="/GradPilot.png" 
            alt="GradPilot Logo" 
            className="h-12 w-auto object-contain drop-shadow-[0_0_15px_rgba(99,102,241,0.4)]" 
          />
        </div>

<<<<<<< HEAD
        {/* UNIFIED HEADING */}
        <h2 className="text-xl font-bold text-white mb-2 text-center">Get started with GradPilot</h2>
        <p className="text-center text-[13px] text-white/40 mb-8">Log in or create a new account to continue.</p>
=======
        <h2 className="text-xl font-bold text-white mb-6 text-center">Welcome back</h2>
>>>>>>> d5c8fd0b23f1e1f126f3ab7cb66827dd5d3393e6

        {/* GLOBAL ERROR */}
        {globalError && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-[13px] font-medium p-3.5 rounded-xl mb-6 flex items-center gap-2">
            <span className="text-lg shrink-0">⚠️</span> {globalError}
          </div>
        )}

<<<<<<< HEAD
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
=======
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          
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

          {/* PASSWORD INPUT WITH EYE TOGGLE */}
          <div>
            <label className="block text-[11px] font-bold text-white/40 uppercase tracking-widest mb-1.5">Password</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                value={password} 
                onChange={(e) => { setPassword(e.target.value); setFieldErrors({...fieldErrors, password: null}); setGlobalError(null); }} 
                className={`w-full bg-[#0d0d14] border rounded-xl pl-4 pr-12 py-3.5 text-slate-200 text-[13px] outline-none transition-colors 
                  ${fieldErrors.password ? 'border-red-500/50 focus:border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.1)]' : 'border-white/10 focus:border-indigo-500/50'}
                `} 
                placeholder="••••••••" 
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors"
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                )}
              </button>
            </div>
            {fieldErrors.password && <span className="text-[11px] text-red-400 font-medium mt-1.5 block">{fieldErrors.password}</span>}
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            className="w-full mt-4 bg-gradient-to-br from-indigo-500 to-purple-500 text-white font-bold text-[14px] py-3.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 shadow-lg shadow-indigo-500/20"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-[13px] text-white/40 mt-8">
          Don't have an account? <Link to="/signup" className="text-indigo-400 font-bold hover:text-indigo-300 transition-colors">Sign up</Link>
        </p>
>>>>>>> d5c8fd0b23f1e1f126f3ab7cb66827dd5d3393e6
      </div>
    </div>
  );
}