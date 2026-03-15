import { supabase } from "./supabase";

const getLocalYYYYMMDD = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// ─── 1. THE CHECKER (Runs on Login) ───
export const runBackgroundStreakCheck = async (userId) => {
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();
  if (!profile || !profile.last_active_date) return null;

  const todayStr = getLocalYYYYMMDD();
  const lastActiveStr = profile.last_active_date;

  const today = new Date(todayStr);
  const lastActive = new Date(lastActiveStr);
  
  const diffTime = today.getTime() - lastActive.getTime();
  const daysMissed = Math.floor(diffTime / (1000 * 60 * 60 * 24)) - 1;

  if (daysMissed > 0) {
    let newFreezes = profile.streak_freezes_owned || 0;
    let newStreak = profile.current_streak || 0;
    let message = "";
    let type = "";

    if (newFreezes >= daysMissed) {
      newFreezes -= daysMissed;
      message = `Phew! You missed ${daysMissed} day(s), but your Streak Freeze saved your ${newStreak}-day streak!`;
      type = "freeze_used";
    } else {
      newStreak = 0;
      newFreezes = 0; 
      message = "Oh no! You missed a day and lost your streak. Time to start rebuilding!";
      type = "streak_lost";
    }

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

    await supabase.from('profiles').update({
      current_streak: newStreak,
      streak_freezes_owned: newFreezes,
      last_active_date: yesterdayStr
    }).eq('id', userId);

    return { message, type, newStreak, newFreezes };
  }
  
  return null;
};

// ─── 2. THE EARNER (Runs when finishing a task/timer) ───
export const processActivityXP = async (userId, xpToAdd, focusMinutesToAdd = 0) => {
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();
  if (!profile) return null;

  const todayStr = getLocalYYYYMMDD();
  let newStreak = profile.current_streak || 0;
  let newLongest = profile.longest_streak || 0;
  let streakExtendedToday = false;

  let newFocus = profile.focus_minutes_today || 0;
  let newSessions = profile.sessions_today || 0;

  // ─── DAILY RESET LOGIC ───
  // If it's a brand new day, increase the streak, but reset daily stats to 0!
  if (profile.last_active_date !== todayStr) {
    newStreak += 1;
    if (newStreak > newLongest) newLongest = newStreak;
    streakExtendedToday = true;
    
    // Reset daily counters
    newFocus = 0;
    newSessions = 0;
  }

  // Add today's new stats
  newFocus += focusMinutesToAdd;
  if (focusMinutesToAdd > 0) {
    newSessions += 1; // Only count it as a session if it was a timer block
  }

  const newXp = (profile.total_xp || 0) + xpToAdd;

  await supabase.from('profiles').update({
    total_xp: newXp,
    current_streak: newStreak,
    longest_streak: newLongest,
    focus_minutes_today: newFocus,
    sessions_today: newSessions, // Save sessions to DB!
    last_active_date: todayStr
  }).eq('id', userId);

  return { newXp, newStreak, streakExtendedToday, newFocus, newSessions };
};