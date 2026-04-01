import React from 'react';
import usePWAInstaller from '../../hooks/usePWAInstaller';

export default function InstallBanner() {
  const { isInstallable, installApp, dismiss } = usePWAInstaller();

  // If it's already installed, or on a browser that doesn't support PWAs, render nothing.
  if (!isInstallable) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[calc(100%-3rem)] max-w-md bg-[#0d0d14] border border-indigo-500/30 p-4 rounded-2xl shadow-[0_10px_40px_rgba(99,102,241,0.2)] flex items-center justify-between animate-[slideUp_0.5s_ease-out]">
      
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-indigo-500/20 text-indigo-400 rounded-xl flex items-center justify-center text-xl shrink-0 border border-indigo-500/20">
          📱
        </div>
        <div>
          <h3 className="text-[14px] font-bold text-slate-200 leading-tight">Get the Desktop App</h3>
          <p className="text-[11px] text-white/40 mt-0.5">Install GradPilot for a distraction-free experience.</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button 
          onClick={dismiss} 
          className="w-8 h-8 flex items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors"
          title="Dismiss"
        >
          ✕
        </button>
        <button 
          onClick={installApp} 
          className="px-4 py-2 bg-gradient-to-br from-indigo-500 to-purple-500 hover:opacity-90 text-white text-[12px] font-bold rounded-xl shadow-lg transition-all active:scale-95"
        >
          Install
        </button>
      </div>

    </div>
  );
}