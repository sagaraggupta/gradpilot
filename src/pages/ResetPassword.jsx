import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase'; // Adjust this import path if needed!

export default function ResetPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [globalError, setGlobalError] = useState(null);

  const handleReset = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setGlobalError("Please enter your email address.");
      return;
    }

    setLoading(true);
    setGlobalError(null);

    // 🔒 Supabase's built-in magic reset function
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/dashboard`, // Sends them to dashboard to change password in Topbar
    });

    if (error) {
      setGlobalError(error.message);
    } else {
      setSuccess(true);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#050508] flex items-center justify-center p-4 font-sans relative overflow-hidden">
      {/* Background glow effects matching Login/Signup */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md bg-white/[0.02] border border-white/10 rounded-3xl p-8 backdrop-blur-xl relative z-10 shadow-2xl shadow-black/50">
        <div className="mb-8 text-center">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/30">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
          </div>
          <h2 className="text-2xl font-extrabold text-white mb-2 tracking-tight">Reset Password</h2>
          <p className="text-[14px] text-white/50">Enter your email to receive a reset link.</p>
        </div>

        {globalError && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-[13px] text-center">
            {globalError}
          </div>
        )}

        {success ? (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6 text-center animate-[fadeIn_0.5s_ease-out]">
            <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-400 text-2xl">
              ✓
            </div>
            <h3 className="text-emerald-400 font-bold mb-2">Check your inbox!</h3>
            <p className="text-emerald-400/80 text-[13px] leading-relaxed mb-6">
              We have sent a password reset link to <strong>{email}</strong>.
            </p>
            <Link to="/login" className="inline-block w-full bg-emerald-500 text-[#0d0d14] font-bold text-[13px] py-3.5 rounded-xl hover:bg-emerald-400 transition-colors">
              Back to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleReset} className="flex flex-col gap-5">
            <div>
              <label className="block text-[11px] font-bold text-white/40 uppercase tracking-widest mb-2">Email Address</label>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                placeholder="pilot@gradpilot.com" 
                className="w-full bg-[#0d0d14] border border-white/10 rounded-xl px-4 py-3.5 text-slate-200 text-[14px] outline-none focus:border-indigo-500/50 transition-colors"
              />
            </div>
            
            <button type="submit" disabled={loading} className="w-full mt-2 bg-gradient-to-br from-indigo-500 to-purple-500 text-white font-bold text-[13px] py-3.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50">
              {loading ? "Sending..." : "Send Reset Link"}
            </button>

            <div className="mt-4 text-center">
              <Link to="/login" className="text-[13px] text-white/40 hover:text-white transition-colors">
                ← Back to Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}