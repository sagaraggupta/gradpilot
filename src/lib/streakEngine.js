import { supabase } from "./supabase";

// Generates the current local date formatted as YYYY-MM-DD
export const getLocalYYYYMMDD = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// ─── UTILITY: BULLETPROOF DATE MATH ───
// Calculates the difference in days between two date strings, forcing pure UTC midnights to avoid timezone/DST shifts
const getDaysDifference = (dateStr1, dateStr2) => {
  const [y1, m1, d1] = dateStr1.split('-').map(Number);
  const [y2, m2, d2] = dateStr2.split('-').map(Number);

  const utc1 = Date.UTC(y1, m1 - 1, d1);
  const utc2 = Date.UTC(y2, m2 - 1, d2);

  return Math.floor((utc2 - utc1) / (1000 * 60 * 60 * 24));
};

// ─── PURE LOGIC FUNCTIONS (Easily Testable) ───

// Evaluates whether a user's streak should be maintained, saved by a freeze, or reset to zero
export const calculateStreakCheckUpdates = (profile, todayStr) => {
  if (!profile || !profile.last_active_date) return null;

  const daysMissed = getDaysDifference(profile.last_active_date, todayStr) - 1;

  // If the user has been active yesterday or today, the streak is safe
  if (daysMissed <= 0) return null;

  let newFreezes = profile.streak_freezes_owned || 0;
  let newStreak = profile.current_streak || 0;
  let message = "";
  let type = "";

  if (newFreezes >= daysMissed) {
    // User missed days but has enough freezes to cover the gap
    newFreezes -= daysMissed;
    message = `Phew! You missed ${daysMissed} day(s), but your Streak Freeze saved your ${newStreak}-day streak!`;
    type = "freeze_used";
  } else {
    // User missed days and lacks freezes; reset the streak
    newStreak = 0;
    newFreezes = 0; 
    message = "Oh no! You missed a day and lost your streak. Time to start rebuilding!";
    type = "streak_lost";
  }

  return {
    updates: {
      current_streak: newStreak,
      streak_freezes_owned: newFreezes,
      last_streak_check_date: todayStr
    },
    result: { message, type, newStreak, newFreezes }
  };
};

// Calculates new state for XP, current/longest streaks, and daily focus limits
export const calculateActivityUpdates = (profile, todayStr, xpToAdd, focusMinutesToAdd = 0) => {
  if (!profile) return null;

  let newStreak = profile.current_streak || 0;
  let newLongest = profile.longest_streak || 0;
  let streakExtendedToday = false;

  let newFocus = profile.focus_minutes_today || 0;
  let newSessions = profile.sessions_today || 0;

  // Detect a new day to extend the streak and reset daily counters
  if (profile.last_active_date !== todayStr) {
    newStreak += 1;
    if (newStreak > newLongest) newLongest = newStreak;
    streakExtendedToday = true;
    newFocus = 0;
    newSessions = 0;
  }

  // Accumulate focus time and session counts
  newFocus += focusMinutesToAdd;
  if (focusMinutesToAdd > 0) {
    newSessions += 1; 
  }

  const newXp = (profile.total_xp || 0) + xpToAdd;

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
// Fetches the user profile and executes the streak evaluation logic, updating the DB if necessary
export const runBackgroundStreakCheck = async (userId) => {
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();
  const todayStr = getLocalYYYYMMDD();

  // Efficiency Check: Skip DB updates if we already ran the checker today
  if (profile?.last_streak_check_date === todayStr) return null;

  const stateUpdate = calculateStreakCheckUpdates(profile, todayStr);
  if (!stateUpdate) return null;

  await supabase.from('profiles').update(stateUpdate.updates).eq('id', userId);
  return stateUpdate.result;
};

// 2. THE EARNER
// Applies XP and focus minute additions to the user's profile, saving the new state to the DB
export const processActivityXP = async (userId, xpToAdd, focusMinutesToAdd = 0) => {
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();
  const todayStr = getLocalYYYYMMDD();

  const stateUpdate = calculateActivityUpdates(profile, todayStr, xpToAdd, focusMinutesToAdd);
  if (!stateUpdate) return null;

  await supabase.from('profiles').update(stateUpdate.updates).eq('id', userId);
  return stateUpdate.result;
};