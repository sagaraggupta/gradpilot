import { supabase } from "./supabase";

<<<<<<< HEAD
export const getLocalYYYYMMDD = () => {
=======
const getLocalYYYYMMDD = () => {
>>>>>>> d5c8fd0b23f1e1f126f3ab7cb66827dd5d3393e6
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

<<<<<<< HEAD
// ─── UTILITY: BULLETPROOF DATE MATH ───
// This strips away timezones and DST by forcing pure UTC midnights
const getDaysDifference = (dateStr1, dateStr2) => {
  const [y1, m1, d1] = dateStr1.split('-').map(Number);
  const [y2, m2, d2] = dateStr2.split('-').map(Number);

  const utc1 = Date.UTC(y1, m1 - 1, d1);
  const utc2 = Date.UTC(y2, m2 - 1, d2);

  return Math.floor((utc2 - utc1) / (1000 * 60 * 60 * 24));
};

// ─── PURE LOGIC FUNCTIONS (Easily Testable) ───

export const calculateStreakCheckUpdates = (profile, todayStr) => {
  if (!profile || !profile.last_active_date) return null;

  const daysMissed = getDaysDifference(profile.last_active_date, todayStr) - 1;

  // If they haven't missed any days, do nothing
  if (daysMissed <= 0) return null;

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

  return {
    updates: {
      current_streak: newStreak,
      streak_freezes_owned: newFreezes,
      last_streak_check_date: todayStr // Fix: Log the check, but leave last_active_date alone!
    },
    result: { message, type, newStreak, newFreezes }
  };
};

export const calculateActivityUpdates = (profile, todayStr, xpToAdd, focusMinutesToAdd = 0) => {
  if (!profile) return null;

=======
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
>>>>>>> d5c8fd0b23f1e1f126f3ab7cb66827dd5d3393e6
  let newStreak = profile.current_streak || 0;
  let newLongest = profile.longest_streak || 0;
  let streakExtendedToday = false;

  let newFocus = profile.focus_minutes_today || 0;
  let newSessions = profile.sessions_today || 0;

<<<<<<< HEAD
  // DAILY RESET LOGIC
=======
  // ─── DAILY RESET LOGIC ───
  // If it's a brand new day, increase the streak, but reset daily stats to 0!
>>>>>>> d5c8fd0b23f1e1f126f3ab7cb66827dd5d3393e6
  if (profile.last_active_date !== todayStr) {
    newStreak += 1;
    if (newStreak > newLongest) newLongest = newStreak;
    streakExtendedToday = true;
    
<<<<<<< HEAD
=======
    // Reset daily counters
>>>>>>> d5c8fd0b23f1e1f126f3ab7cb66827dd5d3393e6
    newFocus = 0;
    newSessions = 0;
  }

<<<<<<< HEAD
  newFocus += focusMinutesToAdd;
  if (focusMinutesToAdd > 0) {
    newSessions += 1; 
=======
  // Add today's new stats
  newFocus += focusMinutesToAdd;
  if (focusMinutesToAdd > 0) {
    newSessions += 1; // Only count it as a session if it was a timer block
>>>>>>> d5c8fd0b23f1e1f126f3ab7cb66827dd5d3393e6
  }

  const newXp = (profile.total_xp || 0) + xpToAdd;

<<<<<<< HEAD
  return {
    updates: {
      total_xp: newXp,
      current_streak: newStreak,
      longest_streak: newLongest,
      focus_minutes_today: newFocus,
      sessions_today: newSessions,
      last_active_date: todayStr
    },
    result: { newXp, newStreak, streakExtendedToday, newFocus, newSessions }
  };
};

// ─── SUPABASE EXECUTION LAYER ───

// 1. THE CHECKER
export const runBackgroundStreakCheck = async (userId) => {
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();
  const todayStr = getLocalYYYYMMDD();

  // Efficiency Check: Skip if we already ran the checker today
  if (profile?.last_streak_check_date === todayStr) return null;

  const stateUpdate = calculateStreakCheckUpdates(profile, todayStr);
  if (!stateUpdate) return null;

  await supabase.from('profiles').update(stateUpdate.updates).eq('id', userId);
  return stateUpdate.result;
};

// 2. THE EARNER
export const processActivityXP = async (userId, xpToAdd, focusMinutesToAdd = 0) => {
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();
  const todayStr = getLocalYYYYMMDD();

  const stateUpdate = calculateActivityUpdates(profile, todayStr, xpToAdd, focusMinutesToAdd);
  if (!stateUpdate) return null;

  await supabase.from('profiles').update(stateUpdate.updates).eq('id', userId);
  return stateUpdate.result;
=======
  await supabase.from('profiles').update({
    total_xp: newXp,
    current_streak: newStreak,
    longest_streak: newLongest,
    focus_minutes_today: newFocus,
    sessions_today: newSessions, // Save sessions to DB!
    last_active_date: todayStr
  }).eq('id', userId);

  return { newXp, newStreak, streakExtendedToday, newFocus, newSessions };
>>>>>>> d5c8fd0b23f1e1f126f3ab7cb66827dd5d3393e6
};