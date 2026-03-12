import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function SignUp() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // UI States
  const [showPassword, setShowPassword] = useState(false);
  const [globalError, setGlobalError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const navigate = useNavigate();

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setGlobalError(null);
    setFieldErrors({});

    // 1. Inline Field Validation
    const errors = {};
    if (!name.trim()) errors.name = "Please enter your full name.";
    if (!email.trim()) errors.email = "Email address is required.";
    if (!password) {
      errors.password = "Password is required.";
    } else if (password.length < 6) {
      errors.password = "Password must be at least 6 characters long.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setLoading(false);
      return;
    }

    // 2. Supabase Authentication
    const { error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        data: { full_name: name }
      }
    });

    if (error) {
      setGlobalError(error.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 2500); 
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0d14] flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-3xl p-8 shadow-2xl backdrop-blur-sm animate-[fadeIn_0.3s_ease-out]">
        
        {/* LOGO & BRANDING */}
        <div className="flex flex-col items-center gap-3 mb-8 justify-center">
          <img 
            src="/GradPilot.png" 
            alt="GradPilot Logo" 
            className="h-12 w-auto object-contain drop-shadow-[0_0_15px_rgba(99,102,241,0.4)]" 
          />
        </div>

        <h2 className="text-xl font-bold text-white mb-6 text-center">Create your account</h2>

        {/* GLOBAL ERROR */}
        {globalError && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-[13px] font-medium p-3.5 rounded-xl mb-6 flex items-center gap-2">
            <span className="text-lg shrink-0">⚠️</span> {globalError}
          </div>
        )}

        {/* SUCCESS MESSAGE */}
        {success && (
          <div className="bg-green-500/10 border border-green-500/30 text-green-400 text-[13px] font-medium p-3.5 rounded-xl mb-6 flex items-center gap-2 animate-[fadeIn_0.3s_ease-out]">
            <span className="text-lg shrink-0">✨</span> Account created successfully! Redirecting to login...
          </div>
        )}

        <form onSubmit={handleSignUp} className="flex flex-col gap-4">
          
          {/* NAME INPUT */}
          <div>
            <label className="block text-[11px] font-bold text-white/40 uppercase tracking-widest mb-1.5">Full Name</label>
            <input 
              type="text" 
              value={name} 
              onChange={(e) => { setName(e.target.value); setFieldErrors({...fieldErrors, name: null}); }} 
              className={`w-full bg-[#0d0d14] border rounded-xl px-4 py-3.5 text-slate-200 text-[13px] outline-none transition-colors 
                ${fieldErrors.name ? 'border-red-500/50 focus:border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.1)]' : 'border-white/10 focus:border-indigo-500/50'}
              `} 
              placeholder="e.g. Sagar Gupta" 
            />
            {fieldErrors.name && <span className="text-[11px] text-red-400 font-medium mt-1.5 block">{fieldErrors.name}</span>}
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
                placeholder="Create a strong password (min. 6 chars)" 
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
            disabled={loading || success} 
            className="w-full mt-4 bg-gradient-to-br from-indigo-500 to-purple-500 text-white font-bold text-[14px] py-3.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 shadow-lg shadow-indigo-500/20"
          >
            {loading ? 'Creating account...' : success ? 'Success!' : 'Sign Up'}
          </button>
        </form>

        <p className="text-center text-[13px] text-white/40 mt-8">
          Already have an account? <Link to="/login" className="text-indigo-400 font-bold hover:text-indigo-300 transition-colors">Log in</Link>
        </p>
      </div>
    </div>
  );
}