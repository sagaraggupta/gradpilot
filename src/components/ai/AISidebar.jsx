import React from 'react';

export default function AISidebar({ 
  currentBalance, 
  activePersona, 
  unlockedPersonas, 
  isTyping, 
  handleSendMessage, 
  equipPersona, 
  unlockPersona, 
  PERSONAS, 
  SMART_ACTIONS 
}) {
  return (
    <div className="w-full lg:w-80 flex flex-col gap-4 shrink-0 overflow-y-auto pr-1">
      {/* SMART ACTIONS */}
      <div className="bg-white/5 border border-white/10 rounded-3xl p-5">
        <h3 className="text-slate-100 font-semibold text-[14px] mb-4 flex items-center gap-2">
          <span className="text-indigo-400">⚡</span> Premium Actions
        </h3>
        <div className="flex flex-col gap-3">
          {SMART_ACTIONS.map(action => {
            const canAfford = currentBalance >= action.cost;
            return (
              <button 
                key={action.id} 
                onClick={() => handleSendMessage(null, action.command, action.cost)}
                disabled={isTyping || !canAfford}
                className="flex items-center justify-between p-3 rounded-xl bg-[#0d0d14] border border-white/5 hover:border-indigo-500/30 transition-all text-left group disabled:opacity-50 disabled:hover:border-white/5"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{action.icon}</span>
                  <span className={`text-[12px] font-bold text-slate-200 transition-colors ${action.id === 'parse' ? 'group-hover:text-green-400' : 'group-hover:text-indigo-300'}`}>{action.name}</span>
                </div>
                <div className="text-[10px] font-bold text-amber-400 bg-amber-400/10 px-2 py-1 rounded-md">-{action.cost} 🪙</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* PERSONA SHOP */}
      <div className="bg-white/5 border border-white/10 rounded-3xl p-5 flex-1">
        <h3 className="text-slate-100 font-semibold text-[14px] mb-1 flex items-center gap-2">
          <span className="text-purple-400">🎭</span> AI Personas
        </h3>
        <p className="text-[11px] text-white/40 mb-4">Unlock different teaching styles.</p>
        
        <div className="flex flex-col gap-3">
          {Object.entries(PERSONAS).map(([id, p]) => {
            const isUnlocked = unlockedPersonas.includes(id);
            const isActive = activePersona === id;
            const canAfford = currentBalance >= p.cost;

            return (
              <div key={id} className={`p-3 rounded-xl border transition-all ${isActive ? 'bg-indigo-500/10 border-indigo-500/50 shadow-md' : 'bg-[#0d0d14] border-white/5'}`}>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl bg-white/5 w-10 h-10 flex items-center justify-center rounded-xl">{p.icon}</span>
                  <div className="min-w-0">
                    <div className="text-[13px] font-bold text-slate-200 truncate">{p.name}</div>
                    <div className="text-[10px] text-white/40 leading-tight pr-1">{p.desc}</div>
                  </div>
                </div>
                
                <button 
                  onClick={() => isUnlocked ? equipPersona(id) : unlockPersona(id, p.cost)}
                  disabled={(!isUnlocked && !canAfford) || isActive}
                  className={`w-full py-2 rounded-lg text-[11px] font-bold transition-all ${isActive ? 'bg-indigo-500/20 text-indigo-300 cursor-default' : isUnlocked ? 'bg-white/10 text-white hover:bg-white/20' : canAfford ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30' : 'bg-white/5 text-white/20 cursor-not-allowed'}`}
                >
                  {isActive ? 'Active' : isUnlocked ? 'Equip Persona' : `Unlock (${p.cost} 🪙)`}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}