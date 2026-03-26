import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

export default function PomodoroPet({ profile }) {
  // Fallback to 0 if profile hasn't loaded yet
  const xp = profile?.total_xp || 0;
  const streak = profile?.current_streak || 0;

  // 🧮 THE LEVELING ALGORITHM
  // Each level requires progressively more XP (Level * 100)
  const { level, progressPct, xpNeededForNext, currentLevelXp } = useMemo(() => {
    let currentLevel = 1;
    let threshold = 100;
    let previousThreshold = 0;
    
    while (xp >= threshold) {
      currentLevel++;
      previousThreshold = threshold;
      threshold += currentLevel * 100;
    }
    
    const xpInThisLevel = xp - previousThreshold;
    const requiredForNext = threshold - previousThreshold;
    const pct = Math.min(100, Math.max(0, (xpInThisLevel / requiredForNext) * 100));
    
    return {
      level: currentLevel,
      progressPct: pct,
      xpNeededForNext: requiredForNext - xpInThisLevel,
      currentLevelXp: xpInThisLevel
    };
  }, [xp]);

  // 🐉 THE EVOLUTION TREE
  const petStage = useMemo(() => {
    if (level < 5) return { name: "Focus Egg", emoji: "🥚", message: "Protect it with focus." };
    if (level < 10) return { name: "Spark Bird", emoji: "🐥", message: "It's learning to fly!" };
    if (level < 20) return { name: "Study Fox", emoji: "🦊", message: "Sharp and focused." };
    return { name: "Deep Work Dragon", emoji: "🐉", message: "An unstoppable force." };
  }, [level]);

  // 🔥 MOOD MODIFIERS BASED ON STREAK
  const isSleepy = streak === 0;
  const isOnFire = streak >= 3;

  return (
    <div className="bg-gradient-to-br from-slate-900 to-[#0d0d14] rounded-3xl border border-slate-800 p-6 flex flex-col md:flex-row items-center gap-6 shadow-xl relative overflow-hidden">
      
      {/* Background Glow based on streak */}
      {isOnFire && (
        <div className="absolute top-1/2 left-12 -translate-y-1/2 w-32 h-32 bg-orange-500/20 rounded-full blur-3xl animate-pulse pointer-events-none" />
      )}

      {/* ─── THE PET STAGE ─── */}
      <div className="relative shrink-0 w-28 h-28 bg-slate-800/50 rounded-2xl border border-slate-700 flex items-center justify-center shadow-inner">
        
        {/* Sleeping Zzz's */}
        {isSleepy && (
          <motion.div 
            animate={{ y: [-5, -15], opacity: [1, 0] }} 
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute -top-2 right-2 text-slate-400 font-bold text-sm"
          >
            Zzz
          </motion.div>
        )}

        {/* The Actual Pet Animation */}
        <motion.div
          animate={
            isSleepy 
              ? { scale: [1, 1.02, 1], rotate: [0, 2, 0, -2, 0] } // Breathing slowly
              : { y: [0, -8, 0] } // Floating energetically
          }
          transition={{ repeat: Infinity, duration: isSleepy ? 4 : 2, ease: "easeInOut" }}
          className="text-6xl drop-shadow-2xl relative z-10 filter"
        >
          {petStage.emoji}
        </motion.div>

        {/* Fire Aura for High Streaks */}
        {isOnFire && (
          <motion.div 
            animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="absolute inset-0 border-2 border-orange-500/50 rounded-2xl"
          />
        )}
      </div>

      {/* ─── THE LEVELING STATS ─── */}
      <div className="flex-1 w-full flex flex-col justify-center">
        <div className="flex justify-between items-end mb-2">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold text-white font-['Plus_Jakarta_Sans']">
                {petStage.name}
              </h3>
              <span className="bg-indigo-500/20 text-indigo-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-indigo-500/30 uppercase tracking-wider">
                Lvl {level}
              </span>
            </div>
            <p className="text-sm text-slate-400 mt-1">{petStage.message}</p>
          </div>
          
          <div className="text-right">
            <div className="text-[13px] font-bold text-slate-300">
              {currentLevelXp} <span className="text-slate-500">/ {currentLevelXp + xpNeededForNext} XP</span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden border border-slate-700/50 shadow-inner relative mt-1">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full relative"
          >
            {/* Glossy shine effect on the bar */}
            <div className="absolute top-0 left-0 right-0 h-1/2 bg-white/20 rounded-t-full" />
          </motion.div>
        </div>
        
        <div className="text-[11px] font-bold text-slate-500 mt-2 text-right uppercase tracking-wider">
          {xpNeededForNext} XP to next level
        </div>
      </div>

    </div>
  );
}