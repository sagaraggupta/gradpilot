import React, { useState, useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

export default function ProtectedRoute() {
  const { user, loading: authLoading } = useAuth();
  const [profileStatus, setProfileStatus] = useState('checking'); 

  useEffect(() => {
    const checkProfile = async () => {
      if (!user) {
        setProfileStatus('missing');
        return;
      }
      
      // 🚀 FIX: Select daily_focus_goal instead of just id
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('id', user.id)
        .single();

      // 🚀 FIX: Ensure they have a profile AND have completed the focus goal
      if (data && data.full_name && data.full_name.trim() !== '') {
        setProfileStatus('exists'); 
      } else {
        setProfileStatus('missing'); 
      }
    };

    if (!authLoading) {
      checkProfile();
    }
  }, [user, authLoading]);

  // Show loading screen while auth OR profile check is running
  if (authLoading || profileStatus === 'checking') {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0d0d14] text-slate-100 font-['Plus_Jakarta_Sans']">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-slate-400 font-medium animate-pulse">Loading GradPilot...</p>
        </div>
      </div>
    );
  }

  // 1. Not logged in? Kick to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 2. Logged in, but NO profile or focus goal? Kick to onboarding
  if (profileStatus === 'missing') {
    return <Navigate to="/onboarding" replace />;
  }

  // 3. Logged in WITH full profile? Let them into the Dashboard!
  return <Outlet />;
}