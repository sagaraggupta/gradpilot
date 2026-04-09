import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function LiveActivityFeed({ squadIds }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!squadIds || squadIds.length === 0) return;

    const fetchActivities = async () => {
      const { data } = await supabase
        .from('activity_logs')
        .select('*, profiles!inner(full_name, equipped_frame)')
        .in('user_id', squadIds)
        .order('created_at', { ascending: false })
        .limit(10);
        
      if (data) setActivities(data);
      setLoading(false);
    };

    fetchActivities();
    
    // Optional: You can set up an interval here to fetch every 60 seconds to make it "Live" without websockets!
    const interval = setInterval(fetchActivities, 60000);
    return () => clearInterval(interval);
  }, [squadIds]);

  const getActionIcon = (type) => {
    if (type === 'focus_session') return '🧠';
    if (type === 'task_done') return '✅';
    if (type === 'streak_up') return '🔥';
    return '⚡';
  };

  return (
    <div className="bg-[#0d0d14] border border-white/10 rounded-3xl p-5 shadow-xl flex flex-col h-full">
      <h3 className="text-[14px] font-bold text-slate-200 uppercase tracking-widest mb-4 flex items-center gap-2">
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
        </span>
        Live Squad Feed
      </h3>

      <div className="flex-1 overflow-y-auto pr-2 -mr-2 flex flex-col gap-3 relative hide-scrollbar">
        {loading ? (
          <div className="text-white/30 text-[12px] text-center mt-4">Tuning into squad frequencies...</div>
        ) : activities.length === 0 ? (
          <div className="text-white/30 text-[12px] text-center mt-4 border border-dashed border-white/10 p-4 rounded-xl">
            The squad is quiet right now.
          </div>
        ) : (
          activities.map((log) => (
            <div key={log.id} className="bg-white/5 border border-white/5 p-3 rounded-2xl animate-[fadeIn_0.4s_ease-out] flex gap-3 items-start">
              <div className="text-xl bg-[#0d0d14] p-2 rounded-xl border border-white/5 shrink-0">
                {getActionIcon(log.action_type)}
              </div>
              <div className="min-w-0">
                <div className="text-[12px] text-white/50 mb-0.5">
                  <strong className="text-indigo-300">{log.profiles?.full_name?.split(' ')[0]}</strong>
                </div>
                <div className="text-[13px] font-medium text-slate-200 leading-snug">{log.description}</div>
                {log.xp_earned > 0 && (
                  <div className="text-[11px] font-black text-amber-400 mt-1.5 bg-amber-500/10 inline-block px-2 py-0.5 rounded-md border border-amber-500/20 shadow-sm shadow-amber-500/10">
                    +{log.xp_earned} 🪙
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}