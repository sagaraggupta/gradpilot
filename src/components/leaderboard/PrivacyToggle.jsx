import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function PrivacyToggle({ userId, initialStatus, onToggle }) {
  const [isPublic, setIsPublic] = useState(initialStatus ?? true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (initialStatus !== undefined) setIsPublic(initialStatus);
  }, [initialStatus]);

  const handleToggle = async () => {
    if (isUpdating || !userId) return;
    setIsUpdating(true);
    
    const newStatus = !isPublic;
    
    // 1. Optimistic UI update
    setIsPublic(newStatus);
    if (onToggle) onToggle(newStatus);

    // 2. Database update
    const { error } = await supabase
      .from('profiles')
      .update({ is_public: newStatus })
      .eq('id', userId);

    if (error) {
      console.error("Failed to update privacy:", error);
      setIsPublic(!newStatus); // Rollback on error
    }
    
    setIsUpdating(false);
  };

  return (
    <div className="flex items-center gap-3 bg-[#0d0d14] border border-white/10 px-4 py-2.5 rounded-xl shadow-inner">
      <div className="flex flex-col">
        <span className="text-[12px] font-bold text-slate-200 flex items-center gap-1.5">
          {isPublic ? '🌍 Public Profile' : '👻 Incognito Mode'}
        </span>
        <span className="text-[10px] text-white/40">
          {isPublic ? 'Visible on leaderboards' : 'Hidden from campus'}
        </span>
      </div>
      
      <button 
        onClick={handleToggle}
        disabled={isUpdating}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ml-2 ${isPublic ? 'bg-indigo-500' : 'bg-slate-700'}`}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isPublic ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
    </div>
  );
}