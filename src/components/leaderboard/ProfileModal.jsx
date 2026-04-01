import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import { supabase } from '../../lib/supabase';

export default function ProfileModal({ isOpen, onClose, pilotId }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen || !pilotId) return;

    const fetchDetailedStats = async () => {
      setLoading(true);
      try {
        // Fetch their profile, their focus sessions, and their completed tasks in parallel
        const [profileRes, sessionsRes, tasksRes] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', pilotId).single(),
          supabase.from('study_sessions').select('duration_minutes').eq('user_id', pilotId),
          supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('user_id', pilotId).eq('status', 'completed')
        ]);

        const totalFocusMinutes = sessionsRes.data?.reduce((acc, s) => acc + (s.duration_minutes || 0), 0) || 0;

        setStats({
          profile: profileRes.data || {},
          focusHours: Math.floor(totalFocusMinutes / 60),
          tasksCompleted: tasksRes.count || 0
        });
      } catch (err) {
        console.error("Error fetching pilot stats:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDetailedStats();
  }, [isOpen, pilotId]);

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Pilot Dossier">
      {loading || !stats ? (
        <div className="flex flex-col items-center justify-center py-12 text-indigo-300/50">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin mb-4" />
          <p className="text-[13px] font-bold tracking-widest uppercase">Retrieving Secure Data...</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6 animate-[fadeIn_0.3s_ease-out]">
          
          {/* HEADER: Avatar & Name */}
          <div className="flex items-center gap-5 bg-gradient-to-br from-indigo-500/10 to-purple-500/5 p-5 rounded-2xl border border-indigo-500/20">
            <div className="w-16 h-16 rounded-full bg-indigo-500/20 border-2 border-indigo-400 flex items-center justify-center text-2xl font-black text-indigo-200 shadow-[0_0_15px_rgba(99,102,241,0.4)]">
              {stats.profile.full_name?.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-100">{stats.profile.full_name}</h2>
              <p className="text-[12px] text-indigo-300/70 font-bold uppercase tracking-widest mt-0.5">
                Pilot Status: <span className="text-emerald-400">Active</span>
              </p>
            </div>
          </div>

          {/* STATS GRID */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#0d0d14] border border-white/10 p-4 rounded-2xl flex flex-col items-center text-center shadow-inner">
              <span className="text-2xl mb-1">🌟</span>
              <span className="text-[20px] font-black text-amber-400">{stats.profile.total_xp?.toLocaleString() || 0}</span>
              <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-1">Total XP</span>
            </div>
            
            <div className="bg-[#0d0d14] border border-white/10 p-4 rounded-2xl flex flex-col items-center text-center shadow-inner">
              <span className="text-2xl mb-1">🔥</span>
              <span className="text-[20px] font-black text-orange-400">{stats.profile.current_streak || 0}</span>
              <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-1">Day Streak</span>
            </div>

            <div className="bg-[#0d0d14] border border-white/10 p-4 rounded-2xl flex flex-col items-center text-center shadow-inner">
              <span className="text-2xl mb-1">🧠</span>
              <span className="text-[20px] font-black text-indigo-400">{stats.focusHours}h</span>
              <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-1">Deep Work</span>
            </div>

            <div className="bg-[#0d0d14] border border-white/10 p-4 rounded-2xl flex flex-col items-center text-center shadow-inner">
              <span className="text-2xl mb-1">✅</span>
              <span className="text-[20px] font-black text-emerald-400">{stats.tasksCompleted}</span>
              <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-1">Tasks Done</span>
            </div>
          </div>

        </div>
      )}
    </Modal>
  );
}