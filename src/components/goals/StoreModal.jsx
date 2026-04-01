import React from 'react';
import Modal from '../ui/Modal';
import { Icon, Icons } from '../ui/Icon';
import XPSourceTracker from "./XPSourceTracker";

export default function StoreModal({
  isStoreOpen, setIsStoreOpen, gamification, storeTab, setStoreTab,
  profile, handleBuyFreeze, newReward, setNewReward, handleCreateReward,
  isSubmitting, customRewards, handleDeleteReward, redeemReward,
  userSettings, handleBuyOrEquipTheme, THEME_OPTIONS, SHOP_FRAMES,
  getInitials, handleBuyOrEquipFrame,
  habits, goals, totalXp
}) {
  return (
    <Modal isOpen={isStoreOpen} onClose={() => setIsStoreOpen(false)} title="XP Reward Store">
      <div className="flex flex-col gap-4">
        
        <div className="bg-[#0d0d14] border border-white/10 rounded-xl p-4 flex justify-between items-center">
          <div>
            <div className="text-[11px] text-white/40 uppercase tracking-widest font-bold">Wallet Balance</div>
            <div className="text-2xl font-extrabold text-amber-400">{gamification.currentBalance.toLocaleString()} XP</div>
          </div>
          <div className="text-3xl drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]">💳</div>
        </div>

        {/* 🚀 MODULAR XP SOURCE TRACKER */}
        <XPSourceTracker habits={habits} goals={goals} totalXp={totalXp} />

        <div className="flex gap-1 border-b border-white/10 pb-2">
          <button onClick={() => setStoreTab("rewards")} className={`flex-1 py-2 text-[12px] font-bold rounded-t-lg transition-colors ${storeTab === "rewards" ? 'border-b-2 border-indigo-400 text-indigo-400' : 'text-white/40 hover:text-white/70'}`}>Boosts</button>
          <button onClick={() => setStoreTab("themes")} className={`flex-1 py-2 text-[12px] font-bold rounded-t-lg transition-colors ${storeTab === "themes" ? 'border-b-2 border-indigo-400 text-indigo-400' : 'text-white/40 hover:text-white/70'}`}>Themes</button>
          <button onClick={() => setStoreTab("frames")} className={`flex-1 py-2 text-[12px] font-bold rounded-t-lg transition-colors ${storeTab === "frames" ? 'border-b-2 border-indigo-400 text-indigo-400' : 'text-white/40 hover:text-white/70'}`}>Frames</button>
        </div>

        {/* TAB 1: REWARDS & BOOSTS */}
        {storeTab === "rewards" && (
          <div className="flex flex-col gap-4 max-h-[400px] overflow-y-auto pr-2">
            <div>
              <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2 px-1">System Upgrades</div>
              <div className="flex justify-between items-center p-3 rounded-xl border border-cyan-500/30 bg-cyan-500/10 group">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center text-xl">🧊</div>
                  <div>
                    <div className="text-[13px] font-bold text-cyan-400">Streak Freeze</div>
                    <div className="text-[10px] text-white/50 mt-0.5">Protects your streak if you miss a day.</div>
                  </div>
                </div>
                <button 
                  onClick={handleBuyFreeze} 
                  disabled={profile.streak_freezes_owned >= 2 || gamification.currentBalance < 500}
                  className={`px-4 py-2 rounded-lg text-[12px] font-bold transition-all shrink-0 ml-2
                    ${profile.streak_freezes_owned >= 2 ? 'bg-white/5 text-white/30 cursor-not-allowed' : 
                    gamification.currentBalance >= 500 ? 'bg-cyan-500 text-[#0d0d14] hover:bg-cyan-400 hover:scale-105 shadow-[0_0_15px_rgba(6,182,212,0.4)]' : 'bg-white/5 text-white/30 cursor-not-allowed'}`}
                >
                  {profile.streak_freezes_owned >= 2 ? "Max Owned" : "500 XP"}
                </button>
              </div>
            </div>

            <div className="mt-2">
              <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2 px-1">Custom Real-Life Rewards</div>
              <form onSubmit={handleCreateReward} className="bg-white/5 border border-white/10 p-3 rounded-xl flex flex-col gap-3 mb-3">
                <div className="flex gap-2">
                  <input required type="text" placeholder="e.g. Order Pizza 🍕" value={newReward.title} onChange={e => setNewReward({...newReward, title: e.target.value})} className="flex-1 bg-[#0d0d14] border border-white/10 rounded-lg px-3 py-2 text-[12px] text-slate-200 outline-none focus:border-indigo-500/50" />
                  <input required type="number" min="50" step="50" placeholder="Cost" value={newReward.cost} onChange={e => setNewReward({...newReward, cost: e.target.value})} className="w-24 bg-[#0d0d14] border border-white/10 rounded-lg px-3 py-2 text-[12px] text-amber-400 font-bold outline-none focus:border-amber-500/50" />
                </div>
                <button type="submit" disabled={isSubmitting} className="w-full py-2 bg-indigo-500/20 text-indigo-300 text-[12px] font-bold rounded-lg hover:bg-indigo-500/30 transition-colors">+ Create Reward</button>
              </form>

              <div className="flex flex-col gap-2">
                {customRewards.length === 0 ? (
                  <div className="text-center text-white/30 text-[12px] py-4">No rewards created yet.</div>
                ) : (
                  customRewards.map(reward => {
                    const canAfford = gamification.currentBalance >= reward.cost;
                    return (
                      <div key={reward.id} className="flex justify-between items-center p-3 rounded-xl border border-white/5 bg-[#0d0d14] group hover:border-white/10 transition-colors">
                        <div className="flex items-center gap-3">
                          <button onClick={() => handleDeleteReward(reward.id)} className="w-6 h-6 rounded bg-red-500/10 text-red-400 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all"><Icon d={Icons.x} size={12} /></button>
                          <div className="text-[13px] font-bold text-slate-200">{reward.title}</div>
                        </div>
                        <button 
                          onClick={() => redeemReward(reward)} disabled={!canAfford}
                          className={`px-4 py-1.5 rounded-lg text-[12px] font-bold transition-all flex items-center gap-1.5 shrink-0 ml-2 ${canAfford ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 hover:scale-105' : 'bg-white/5 text-white/30 cursor-not-allowed'}`}
                        >
                          {reward.cost} XP
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: THEMES */}
        {storeTab === "themes" && (
          <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto pr-2">
            <p className="text-[12px] text-white/50 mb-2">Unlock global color themes using advanced CSS hue-rotation!</p>
            {Object.entries(THEME_OPTIONS).map(([key, config]) => {
              const isUnlocked = userSettings.unlocked_themes.includes(key);
              const isActive = userSettings.active_theme === key;
              const canAfford = gamification.currentBalance >= config.cost;

              return (
                <div key={key} className={`flex justify-between items-center p-4 rounded-xl border transition-all ${isActive ? 'bg-indigo-500/10 border-indigo-500/50' : 'bg-[#0d0d14] border-white/5 hover:border-white/10'}`}>
                  <div>
                    <div className="text-[14px] font-bold text-slate-200">{config.name}</div>
                    <div className="text-[11px] text-white/40 mt-0.5">{isUnlocked ? '🔓 Unlocked' : `🔒 Costs ${config.cost.toLocaleString()} XP`}</div>
                  </div>
                  <button 
                    onClick={() => handleBuyOrEquipTheme(key, config)}
                    disabled={!isUnlocked && !canAfford}
                    className={`px-4 py-2 rounded-lg text-[12px] font-bold transition-all shadow-sm ${isActive ? 'bg-indigo-500 text-white cursor-default' : isUnlocked ? 'bg-white/10 text-white hover:bg-white/20' : canAfford ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30' : 'bg-white/5 text-white/20 cursor-not-allowed'}`}
                  >
                    {isActive ? 'Equipped ✓' : isUnlocked ? 'Equip Theme' : `Buy (${config.cost})`}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 3: AVATAR FRAMES */}
        {storeTab === "frames" && (
          <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto pr-2">
            <div className="grid grid-cols-2 gap-4">
              {SHOP_FRAMES.map(frame => {
                const isUnlocked = profile.owned_frames?.includes(frame.id) || frame.id === "none";
                const isActive = profile.equipped_frame === frame.id;
                const canAfford = gamification.currentBalance >= frame.cost;

                return (
                  <div key={frame.id} className={`flex flex-col items-center p-4 rounded-xl border transition-all ${isActive ? 'bg-indigo-500/10 border-indigo-500/50 shadow-md' : 'bg-[#0d0d14] border-white/5 hover:border-white/10'}`}>
                    <div className="mb-4">
                      <div className={`w-14 h-14 rounded-full flex items-center justify-center ${frame.class}`}>
                        <div className="w-full h-full rounded-full bg-slate-800 flex items-center justify-center text-lg font-bold text-slate-300">
                          {getInitials()}
                        </div>
                      </div>
                    </div>
                    <div className="text-center mb-3">
                      <div className="text-[13px] font-bold text-slate-200">{frame.name}</div>
                      <div className={`text-[10px] font-bold mt-0.5 ${isUnlocked ? 'text-green-400' : 'text-amber-400'}`}>
                        {isUnlocked ? "OWNED" : `${frame.cost.toLocaleString()} XP`}
                      </div>
                    </div>
                    <button 
                      onClick={() => handleBuyOrEquipFrame(frame)}
                      disabled={(!isUnlocked && !canAfford) || isActive}
                      className={`w-full py-1.5 rounded-lg text-[11px] font-bold transition-all shadow-sm ${isActive ? 'bg-indigo-500/20 text-indigo-300 cursor-default' : isUnlocked ? 'bg-white/10 text-white hover:bg-white/20' : canAfford ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30' : 'bg-white/5 text-white/20 cursor-not-allowed'}`}
                    >
                      {isActive ? 'Equipped' : isUnlocked ? 'Equip' : `Buy`}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}