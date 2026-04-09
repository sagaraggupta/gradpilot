import React, { useState, useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

export default function ProtectedRoute() {
  const { user, loading: authLoading } = useAuth();
  const [profileStatus, setProfileStatus] = useState('checking'); 
  const location = useLocation(); 

  useEffect(() => {
    const checkProfile = async () => {
      if (!user) {
        setProfileStatus('missing');
        return;
      }
      
      // 🚀 Check for daily_focus_goal. It will be NULL until they finish Onboarding!
      const { data, error } = await supabase
        .from('profiles')
        .select('daily_focus_goal')
        .eq('id', user.id)
        .single();

      if (data && data.daily_focus_goal !== null) {
        setProfileStatus('exists'); 
      } else {
        setProfileStatus('missing'); 
      }
    };

    if (!authLoading) {
      checkProfile();
    }
  }, [user, authLoading]);

  // Show loading screen
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

  // 2. Logged in, but haven't finished Onboarding? Trap them in the setup!
  if (profileStatus === 'missing' && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  // 3. Logged in AND finished Onboarding, but trying to go back to the setup page? Kick to Dashboard!
  if (profileStatus === 'exists' && location.pathname === '/onboarding') {
    return <Navigate to="/dashboard" replace />;
  }

  // 4. Everything is good. Let them in!
  return <Outlet />;
}