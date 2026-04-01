import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function NotificationBell({ userId }) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!userId) return;

    const fetchNotifications = async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (data) {
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.is_read).length);
      }
    };

    fetchNotifications();

    // Setup Realtime Listener so the bell rings instantly when they get a new alert!
    const channel = supabase.channel('realtime_notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` }, 
        (payload) => {
          setNotifications(prev => [payload.new, ...prev].slice(0, 10));
          setUnreadCount(prev => prev + 1);
        }
      ).subscribe();

    return () => supabase.removeChannel(channel);
  }, [userId]);

  const markAllAsRead = async () => {
    setUnreadCount(0);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId).eq('is_read', false);
  };

  return (
    <div className="relative z-50">
      <button 
        onClick={() => { setIsOpen(!isOpen); if (unreadCount > 0 && !isOpen) markAllAsRead(); }}
        className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-xl hover:bg-white/10 transition-colors relative"
      >
        🔔
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-[9px] font-bold text-white items-center justify-center">
              {unreadCount}
            </span>
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-12 right-0 w-80 bg-[#0d0d14] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-[fadeIn_0.2s_ease-out]">
          <div className="p-3 border-b border-white/10 flex justify-between items-center bg-white/5">
            <h3 className="text-[13px] font-bold text-slate-200">Notifications</h3>
            {unreadCount > 0 && <span className="text-[10px] text-indigo-400 font-bold cursor-pointer" onClick={markAllAsRead}>Mark read</span>}
          </div>
          
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-white/40 text-[12px]">No new alerts.</div>
            ) : (
              notifications.map(n => (
                <div key={n.id} className={`p-4 border-b border-white/5 hover:bg-white/5 transition-colors ${!n.is_read ? 'bg-indigo-500/5' : ''}`}>
                  <div className="text-[12px] font-bold text-slate-200 mb-1 flex items-center gap-2">
                    {n.type === 'rank_drop' ? '📉' : n.type === 'invite' ? '🤝' : '⚡'} 
                    {n.title}
                  </div>
                  <div className="text-[11px] text-white/50 leading-relaxed">{n.message}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}