import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import ProgressBar from '../ui/ProgressBar';
import Modal from '../ui/Modal'; // Ensure you import your Modal component!

export default function SquadChallenges({ currentUserId, squadIds }) {
  const [challenges, setChallenges] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [friends, setFriends] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState('');
  const [goal, setGoal] = useState(500);

  useEffect(() => {
    if (!currentUserId) return;

    const fetchChallenges = async () => {
      const { data } = await supabase
        .from('challenges')
        .select('*, challenger:profiles!challenger_id(full_name), target:profiles!target_id(full_name)')
        .eq('status', 'active')
        .or(`challenger_id.eq.${currentUserId},target_id.eq.${currentUserId}`);
      if (data) setChallenges(data);
    };

    fetchChallenges();
  }, [currentUserId]);

  // Fetch squad names for the dropdown when modal opens
  const openChallengeModal = async () => {
    setIsModalOpen(true);
    if (squadIds && squadIds.length > 0) {
      const { data } = await supabase.from('profiles').select('id, full_name').in('id', squadIds).neq('id', currentUserId);
      if (data) setFriends(data);
    }
  };

  const handleIssueChallenge = async (e) => {
    e.preventDefault();
    if (!selectedFriend || !goal) return;

    const { data, error } = await supabase.from('challenges').insert([{
      challenger_id: currentUserId,
      target_id: selectedFriend,
      xp_goal: goal,
      status: 'active'
    }]).select('*, challenger:profiles!challenger_id(full_name), target:profiles!target_id(full_name)').single();

    if (!error && data) {
      setChallenges(prev => [data, ...prev]);
      setIsModalOpen(false);
    }
  };

  return (
    <>
      <div className="bg-gradient-to-br from-orange-500/10 to-[#0d0d14] border border-orange-500/20 rounded-3xl p-5 shadow-xl h-full flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-[14px] font-bold text-orange-400 uppercase tracking-widest flex items-center gap-2">
            <span>⚔️</span> Active Bounties
          </h3>
          <button 
            onClick={openChallengeModal}
            className="text-[10px] bg-orange-500/20 text-orange-300 px-2 py-1 rounded-md font-bold hover:bg-orange-500/30 transition-colors"
          >
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
              
              // Dummy progress for UI (In reality, you'd calculate this based on their DB PR)
              const myProgress = 45; 
              const opponentProgress = 60; 

              return (
                <div key={challenge.id} className="bg-[#0d0d14] border border-white/10 p-4 rounded-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 text-5xl opacity-5">⚔️</div>
                  <div className="text-[12px] text-white/50 font-bold mb-2">Race to {challenge.xp_goal} PR</div>
                  
                  <div className="flex flex-col gap-3">
                    <div>
                      <div className="flex justify-between text-[11px] font-bold mb-1">
                        <span className="text-indigo-400">You</span>
                        <span className="text-white/50">{myProgress}%</span>
                      </div>
                      <ProgressBar value={myProgress} color="#818cf8" height={4} />
                    </div>
                    <div>
                      <div className="flex justify-between text-[11px] font-bold mb-1">
                        <span className="text-orange-400">{opponentName?.split(' ')[0] || "Opponent"}</span>
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

      {/* ─── THE CHALLENGE MODAL ─── */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Issue a Challenge">
        <form onSubmit={handleIssueChallenge} className="flex flex-col gap-4">
          <div>
            <label className="text-[12px] text-white/50 font-bold mb-1 block">Select Opponent</label>
            <select 
              value={selectedFriend} 
              onChange={e => setSelectedFriend(e.target.value)}
              className="w-full bg-[#0d0d14] border border-white/10 p-3 rounded-xl text-[13px] text-slate-200"
              required
            >
              <option value="" disabled>Choose a squadmate...</option>
              {friends.map(f => <option key={f.id} value={f.id}>{f.full_name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[12px] text-white/50 font-bold mb-1 block">Target PR Goal</label>
            <input 
              type="number" 
              value={goal} 
              onChange={e => setGoal(e.target.value)}
              className="w-full bg-[#0d0d14] border border-white/10 p-3 rounded-xl text-[13px] text-slate-200"
              min="100" step="100" required
            />
          </div>
          <button type="submit" className="mt-2 w-full bg-orange-500 hover:bg-orange-400 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-orange-500/20">
            Send Bounty ⚔️
          </button>
        </form>
      </Modal>
    </>
  );
}