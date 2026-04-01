import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import ProgressBar from '../ui/ProgressBar';

export default function SquadChallenges({ currentUserId, squadIds }) {
  const [challenges, setChallenges] = useState([]);

  useEffect(() => {
    if (!currentUserId) return;

    const fetchChallenges = async () => {
      // Fetch active challenges where user is challenger or target
      const { data } = await supabase
        .from('challenges')
        .select('*, challenger:profiles!challenger_id(full_name), target:profiles!target_id(full_name)')
        .eq('status', 'active')
        .or(`challenger_id.eq.${currentUserId},target_id.eq.${currentUserId}`);
        
      if (data) setChallenges(data);
    };

    fetchChallenges();
  }, [currentUserId]);

  return (
    <div className="bg-gradient-to-br from-orange-500/10 to-[#0d0d14] border border-orange-500/20 rounded-3xl p-5 shadow-xl h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-[14px] font-bold text-orange-400 uppercase tracking-widest flex items-center gap-2">
          <span>⚔️</span> Active Bounties
        </h3>
        <button className="text-[10px] bg-orange-500/20 text-orange-300 px-2 py-1 rounded-md font-bold hover:bg-orange-500/30 transition-colors">
          + Issue Challenge
        </button>
      </div>

      <div className="flex flex-col gap-3 flex-1 overflow-y-auto pr-2 -mr-2">
        {challenges.length === 0 ? (
          <div className="text-white/30 text-[12px] text-center mt-4 border border-dashed border-white/10 p-4 rounded-xl">
            No active challenges. Issue one to a squadmate!
          </div>
        ) : (
          challenges.map((challenge) => {
            const isChallenger = challenge.challenger_id === currentUserId;
            const opponentName = isChallenger ? challenge.target?.full_name : challenge.challenger?.full_name;
            
            // For UI purposes, we simulate progress visually. 
            // In reality, you'd calculate XP gained since challenge.created_at
            const myProgress = 45; 
            const opponentProgress = 60; 

            return (
              <div key={challenge.id} className="bg-[#0d0d14] border border-white/10 p-4 rounded-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 text-5xl opacity-5">⚔️</div>
                <div className="text-[12px] text-white/50 font-bold mb-2">Race to {challenge.xp_goal} XP</div>
                
                <div className="flex flex-col gap-3">
                  {/* You */}
                  <div>
                    <div className="flex justify-between text-[11px] font-bold mb-1">
                      <span className="text-indigo-400">You</span>
                      <span className="text-white/50">{myProgress}%</span>
                    </div>
                    <ProgressBar value={myProgress} color="#818cf8" height={4} />
                  </div>
                  
                  {/* Opponent */}
                  <div>
                    <div className="flex justify-between text-[11px] font-bold mb-1">
                      <span className="text-orange-400">{opponentName?.split(' ')[0]}</span>
                      <span className="text-white/50">{opponentProgress}%</span>
                    </div>
                    <ProgressBar value={opponentProgress} color="#fb923c" height={4} />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}