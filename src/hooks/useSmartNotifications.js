import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function useSmartNotifications() {
  const { user } = useAuth();
  
  // 🛡️ ANTI-SPAM: Prevents the hook from double-firing if React re-renders the component
  const hasCheckedThisSession = useRef(false); 

  useEffect(() => {
    // If no user, or if we already checked this session, stop immediately.
    if (!user?.id || hasCheckedThisSession.current) return;

    // 1. Request OS Permission if they haven't decided yet
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const checkAndNotify = async () => {
      // 🛡️ Guard 1: Must have permission
      if (Notification.permission !== 'granted') return;

      // 🛡️ Guard 2: Only nag once per day
      const todayStr = new Date().toLocaleDateString(); 
      const lastNotified = localStorage.getItem('gradpilot_last_notified');
      if (lastNotified === todayStr) return; 

      // 🛡️ Guard 3: Only trigger this specific frontend nag after 5:00 PM (17:00)
      const currentHour = new Date().getHours();
      if (currentHour < 17) return; 
      console.log("🚀 Engine running: Checking for missed habits...");

      try {
        const todayISO = new Date().toISOString().split('T')[0];

        // 🧠 FIX: Check for "Not Today" OR "Is Null"
        const { data: habits, error } = await supabase
          .from('habits')
          .select('name')
          .eq('user_id', user.id)
          .or(`last_completed.neq.${todayISO},last_completed.is.null`);

        if (error) throw error;

        console.log("📦 Habits found from DB:", habits); // 🔍 X-Ray Vision!

        // If they have missed habits, fire the native OS Notification
        if (habits && habits.length > 0) {
          
          // 🚀 LOG FIRST: Save the status BEFORE firing the notification to prevent race conditions
          localStorage.setItem('gradpilot_last_notified', todayStr);
          hasCheckedThisSession.current = true;

          new Notification("GradPilot: Streak at Risk! ⚠️", {
            body: `You still have ${habits.length} habits left today. Don't break the chain!`,
            icon: "/GradPilot.png", // Pointing to your actual icon
            tag: "habit-reminder", // 💡 CRITICAL: Groups notifications so they overwrite instead of stacking
            requireInteraction: true // Keeps the notification on screen until they click or dismiss it
          });
        }
      } catch (error) {
        console.error("Smart Notification Check Failed:", error);
      }
    };

    // Delay the initial check by 5 seconds so the app UI can load smoothly first
    const initialDelay = setTimeout(() => {
      checkAndNotify();
    }, 5000);

    // Quietly check again every 1 hour in the background if they leave the tab open
    const intervalId = setInterval(checkAndNotify, 60 * 60 * 1000);

    // Cleanup memory when the component unmounts
    return () => {
      clearTimeout(initialDelay);
      clearInterval(intervalId);
    };
  }, [user]);
}