import { supabase } from "./supabase";

// Constants for Game Economy Balance
const DECAY_PERCENTAGE = 0.05; // Lose 5% of Pilot Score if a streak breaks

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

// 🎖️ NEW: Dynamic Rank System based on Pilot Score
export const determineRank = (score) => {
  if (score >= 15000) return 'Fleet Admiral';
  if (score >= 5000) return 'Captain';
  if (score >= 1000) return 'Navigator';
  return 'Flight Cadet';
};

// ─── 1. THE STREAK CHECKER & DECAY SYSTEM ───
export const calculateStreakCheckUpdates = (profile, todayStr) => {
  if (!profile || !profile.last_active_date) return null;

  const daysMissed = getDaysDifference(profile.last_active_date, todayStr) - 1;

  if (daysMissed <= 0) return null;

  let newFreezes = profile.streak_freezes_owned || 0;
  let newStreak = profile.current_streak || 0;
  let newPilotScore = profile.pilot_score || 0;
  let message = "";
  let type = "";

  // 🛡️ STREAK FREEZE LOGIC (Now requires streak > 0 to activate!)
  if (newFreezes > 0 && newFreezes >= daysMissed && newStreak > 0) {
    newFreezes -= daysMissed;
    message = `Phew! You missed ${daysMissed} day(s), but your Freeze saved your ${newStreak}-day streak!`;
    type = "freeze_used";
  } else {
    // 💥 INACTIVITY PENALTY (DECAY SYSTEM)
    // Only penalize if they actually had a streak or score to lose
    if (newStreak > 0 || newPilotScore > 0) {
      const penalty = Math.floor(newPilotScore * DECAY_PERCENTAGE);
      newPilotScore = Math.max(0, newPilotScore - penalty);
      message = `You lost your streak and took a -${penalty} Score inactivity penalty. Time to rebuild!`;
    } else {
      message = "You missed a day, but since your streak was 0, you didn't lose any points!";
    }
    
    newStreak = 0;
    newFreezes = 0; 
    type = "streak_lost";
  }

  const newRank = determineRank(newPilotScore);

  return {
    updates: {
      current_streak: newStreak,
      streak_freezes_owned: newFreezes,
      pilot_score: newPilotScore,
      rank_title: newRank,
      last_streak_check_date: todayStr
    },
    result: { message, type, newStreak, newFreezes, newPilotScore, newRank }
  };
};

// ─── 2. THE EARNER (THE DUAL ECONOMY) ───
export const calculateActivityUpdates = (profile, todayStr, amountToAdd, focusMinutesToAdd = 0) => {
  if (!profile) return null;

  let newStreak = profile.current_streak || 0;
  let newLongest = profile.longest_streak || 0;
  let streakExtendedToday = false;

  let newFocus = profile.focus_minutes_today || 0;
  let newSessions = profile.sessions_today || 0;

  // 🔄 NEW DAY RESET LOGIC
  if (profile.last_active_date !== todayStr) {
    newStreak += 1;
    if (newStreak > newLongest) newLongest = newStreak;
    streakExtendedToday = true;
    
    // Reset daily counters
    newFocus = 0;
    newSessions = 0;
  }

  // 🪙 1. CREDITS ECONOMY (Uncapped, Spendable, with Rank Multipliers!)
  let rankMultiplier = 1.0;
  if (profile.rank_title === 'Navigator') rankMultiplier = 1.1; // 10% Bonus
  if (profile.rank_title === 'Captain') rankMultiplier = 1.25;  // 25% Bonus
  if (profile.rank_title === 'Fleet Admiral') rankMultiplier = 1.5; // 50% Bonus

  const multipliedCredits = Math.floor(amountToAdd * rankMultiplier);
  const newCreditsBalance = (profile.credits_balance || 0) + multipliedCredits;

  // 🏆 2. PILOT SCORE ECONOMY (Infinite & Status-Driven)
  const newPilotScore = (profile.pilot_score || 0) + amountToAdd;
  const newRank = determineRank(newPilotScore);

  // Accumulate focus time
  newFocus += focusMinutesToAdd;
  if (focusMinutesToAdd > 0) newSessions += 1; 

  return {
    updates: {
      // Notice: No score_earned_today here! This stops the 400 Bad Request crash.
      credits_balance: newCreditsBalance,
      pilot_score: newPilotScore,
      rank_title: newRank,
      current_streak: newStreak,
      longest_streak: newLongest,
      focus_minutes_today: newFocus,
      sessions_today: newSessions,
      last_active_date: todayStr
    },
    result: { 
      newCredits: newCreditsBalance, 
      newScore: newPilotScore, 
      newRank,
      newStreak, 
      streakExtendedToday, 
      newFocus, 
      newSessions
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

// Keeping the function name processActivityXP so your components don't break!
export const processActivityXP = async (userId, amountToAdd, focusMinutesToAdd = 0) => {
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();
  const todayStr = getLocalYYYYMMDD();

  const stateUpdate = calculateActivityUpdates(profile, todayStr, amountToAdd, focusMinutesToAdd);
  if (!stateUpdate) return null;

  // 🚨 Force Supabase to tell us exactly what it is mad about
  const { data, error } = await supabase.from('profiles').update(stateUpdate.updates).eq('id', userId);
  
  if (error) {
    console.error("❌ EXACT SUPABASE ERROR:", error.message);
    console.error("❌ SUPABASE DETAILS:", error.details);
  }
  
  return stateUpdate.result; 
};