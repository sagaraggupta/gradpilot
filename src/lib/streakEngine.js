import { supabase } from "./supabase";

// Constants for Game Economy Balance
const DAILY_XP_CAP = 500;
const DECAY_PERCENTAGE = 0.05; // Lose 5% of Total XP if a streak breaks

export const getLocalYYYYMMDD = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getDaysDifference = (dateStr1, dateStr2) => {
  const [y1, m1, d1] = dateStr1.split('-').map(Number);
  const [y2, m2, d2] = dateStr2.split('-').map(Number);

  const utc1 = Date.UTC(y1, m1 - 1, d1);
  const utc2 = Date.UTC(y2, m2 - 1, d2);

  return Math.floor((utc2 - utc1) / (1000 * 60 * 60 * 24));
};

// ─── 1. THE STREAK CHECKER & DECAY SYSTEM ───
export const calculateStreakCheckUpdates = (profile, todayStr) => {
  if (!profile || !profile.last_active_date) return null;

  const daysMissed = getDaysDifference(profile.last_active_date, todayStr) - 1;

  if (daysMissed <= 0) return null;

  let newFreezes = profile.streak_freezes_owned || 0;
  let newStreak = profile.current_streak || 0;
  let newTotalXp = profile.total_xp || 0;
  let message = "";
  let type = "";

  // 🛡️ STREAK FREEZE LOGIC
  if (newFreezes > 0 && newFreezes >= daysMissed) {
    newFreezes -= daysMissed;
    message = `Phew! You missed ${daysMissed} day(s), but your Freeze saved your ${newStreak}-day streak!`;
    type = "freeze_used";
  } else {
    // 💥 INACTIVITY PENALTY (DECAY SYSTEM)
    // If they lose a streak, they lose 5% of their total XP!
    const penalty = Math.floor(newTotalXp * DECAY_PERCENTAGE);
    newTotalXp = Math.max(0, newTotalXp - penalty);
    
    newStreak = 0;
    newFreezes = 0; 
    message = `You lost your streak and took a -${penalty} XP inactivity penalty. Time to rebuild!`;
    type = "streak_lost";
  }

  return {
    updates: {
      current_streak: newStreak,
      streak_freezes_owned: newFreezes,
      total_xp: newTotalXp,
      last_streak_check_date: todayStr
    },
    result: { message, type, newStreak, newFreezes, newTotalXp }
  };
};

// ─── 2. THE EARNER & ANTI-SPAM CAP ───
export const calculateActivityUpdates = (profile, todayStr, xpToAdd, focusMinutesToAdd = 0) => {
  if (!profile) return null;

  let newStreak = profile.current_streak || 0;
  let newLongest = profile.longest_streak || 0;
  let streakExtendedToday = false;

  let newFocus = profile.focus_minutes_today || 0;
  let newSessions = profile.sessions_today || 0;
  let xpEarnedToday = profile.xp_earned_today || 0;

  // 🔄 NEW DAY RESET LOGIC
  if (profile.last_active_date !== todayStr) {
    newStreak += 1;
    if (newStreak > newLongest) newLongest = newStreak;
    streakExtendedToday = true;
    
    // Reset daily counters
    newFocus = 0;
    newSessions = 0;
    xpEarnedToday = 0; 
  }

  // 🛡️ ANTI-SPAM DAILY XP CAP LOGIC
  let actualXpToAdd = xpToAdd;
  
  if (xpEarnedToday + xpToAdd > DAILY_XP_CAP) {
    // Only give them whatever XP is left before hitting the cap
    actualXpToAdd = Math.max(0, DAILY_XP_CAP - xpEarnedToday);
  }

  xpEarnedToday += actualXpToAdd;
  const newTotalXp = (profile.total_xp || 0) + actualXpToAdd;

  // Accumulate focus time
  newFocus += focusMinutesToAdd;
  if (focusMinutesToAdd > 0) newSessions += 1; 

  return {
    updates: {
      total_xp: newTotalXp,
      current_streak: newStreak,
      longest_streak: newLongest,
      focus_minutes_today: newFocus,
      sessions_today: newSessions,
      xp_earned_today: xpEarnedToday, // 👈 Track their daily limit
      last_active_date: todayStr
    },
    result: { 
      newXp: newTotalXp, 
      newStreak, 
      streakExtendedToday, 
      newFocus, 
      newSessions,
      hitCap: actualXpToAdd < xpToAdd // Tells the frontend if they hit the cap!
    }
  };
};

// ─── SUPABASE EXECUTION LAYER ───

export const runBackgroundStreakCheck = async (userId) => {
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();
  const todayStr = getLocalYYYYMMDD();

  if (profile?.last_streak_check_date === todayStr) return null;

  const stateUpdate = calculateStreakCheckUpdates(profile, todayStr);
  if (!stateUpdate) return null;

  await supabase.from('profiles').update(stateUpdate.updates).eq('id', userId);
  return stateUpdate.result;
};

export const processActivityXP = async (userId, xpToAdd, focusMinutesToAdd = 0) => {
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();
  const todayStr = getLocalYYYYMMDD();

  const stateUpdate = calculateActivityUpdates(profile, todayStr, xpToAdd, focusMinutesToAdd);
  if (!stateUpdate) return null;

  await supabase.from('profiles').update(stateUpdate.updates).eq('id', userId);
  return stateUpdate.result;
};