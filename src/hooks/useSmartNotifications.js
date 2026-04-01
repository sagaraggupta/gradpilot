import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function useSmartNotifications() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id) return;

    // 1. Ask for OS-level permission if we don't have it yet
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const checkAndNotify = async () => {
      if (Notification.permission !== 'granted') return;

      // 🛡️ ANTI-SPAM GUARD: Only nag them once per day
      const todayStr = new Date().toISOString().split('T')[0];
      const lastNotified = localStorage.getItem('gradpilot_last_notified');
      if (lastNotified === todayStr) return; 

      // ⏰ TIME GUARD: Only trigger the "You're forgetting things" alert after 5:00 PM
      const currentHour = new Date().getHours();
      if (currentHour < 17) return; 

      try {
        // Fetch habits they haven't done today
        const { data: habits, error } = await supabase
          .from('habits')
          .select('name')
          .eq('user_id', user.id)
          .neq('last_completed', todayStr);

        if (error) throw error;

        // If they have missed habits, fire the native OS Notification
        if (habits && habits.length > 0) {
          new Notification("GradPilot: Streak at Risk! ⚠️", {
            body: `You still have ${habits.length} habits left today (like ${habits[0].name}). Don't break the chain!`,
            icon: "/pwa-192x192.png", // Make sure you have your logo in the public folder!
            requireInteraction: true // Keeps the notification on screen until they click it
          });
          
          // Log that we warned them so we don't spam them again today
          localStorage.setItem('gradpilot_last_notified', todayStr);
        }
      } catch (error) {
        console.error("Smart Notification Check Failed:", error);
      }
    };

    // Run the check immediately when the app loads
    checkAndNotify();

    // Then quietly check again every 1 hour in the background
    const intervalId = setInterval(checkAndNotify, 60 * 60 * 1000);

    return () => clearInterval(intervalId); // Cleanup memory when they close the app
  }, [user]);
}